const axios      = require('axios')
const Allocation = require('../models/Allocation')
const Region     = require('../models/Region')
const { computeAllocation, simulateChange, computeSectorNeeds } = require('../utils/optimizer')

const ML_URL = process.env.ML_SERVICE_URL || 'https://newbudget-ml.onrender.com'

// ─── Helper: call ML service ──────────────────────────────────────────────────
async function callML(method, path, data) {
  const url = `${ML_URL}${path}`
  const res  = method === 'get'
    ? await axios.get(url, { timeout: 15000 })
    : await axios.post(url, data, { timeout: 15000 })
  return res.data
}

// ─── Helper: safe numeric conversion ─────────────────────────────────────────
function safeNumBackend(v, fallback = 0) {
  const n = parseFloat(v)
  return isNaN(n) || !isFinite(n) ? fallback : n
}

// ─── Map ML forecast response → sectorNeeds format ───────────────────────────
function mlForecastToNeeds(mlData) {
  const ICONS = { Healthcare: '🏥', Education: '📚', Infrastructure: '🏗️', Agriculture: '🌾', Welfare: '🤝' }
  return mlData.map(d => ({
    sector:       d.sector,
    urgencyScore: Math.round(d.urgencyScore),
    coverageGap:  d.forecastedNeed,
    currentSpend: 0.05,
    trend:        d.trend || 0,
    status:       d.urgencyScore > 70 ? 'critical' : d.urgencyScore > 45 ? 'underfunded' : 'stable',
    reason:       `ML forecast urgency: ${d.urgencyScore.toFixed(1)}/100 · Sector need index: ${(d.forecastedNeed * 100).toFixed(0)}%`,
    icon:         ICONS[d.sector] || '📌',
  }))
}

// ─── Map ML optimize response → our sectorAnalysis format ────────────────────
function mlOptimizeToAnalysis(mlData, totalBudget, population) {
  const ICONS = { Healthcare: '🏥', Education: '📚', Infrastructure: '🏗️', Agriculture: '🌾', Welfare: '🤝' }
  const { allocations, pareto_front, shap_values, sector_analysis } = mlData

  // If ML returns sector_analysis array, use it directly enriched
  if (sector_analysis && Array.isArray(sector_analysis)) {
    return {
      allocations,
      sectorAnalysis: sector_analysis.map(s => ({
        sector:          s.sector,
        fraction:        s.fraction ?? (allocations?.[s.sector] || 0),
        urgencyScore:    s.urgency_score ?? s.urgencyScore ?? 60,
        efficiencyScore: s.efficiency_score ?? s.efficiencyScore ?? 60,
        priority:        (s.urgency_score ?? s.urgencyScore ?? 60) > 70 ? 'HIGH' : (s.urgency_score ?? s.urgencyScore ?? 60) > 45 ? 'MEDIUM' : 'LOW',
        changeFromPrev:  s.change_from_prev ?? 0,
        explanation:     s.explanation || `${s.sector} allocation computed by NSGA-II ML model.`,
        shortReason:     s.short_reason || s.explanation?.slice(0, 60) || `ML-optimized allocation`,
        factors:         s.shap_factors ?? s.factors ?? [],
        projectedOutcome: s.projected_outcome || `Expected impact from ${s.sector} investment.`,
        icon:            ICONS[s.sector] || '📌',
        shapValue:       shap_values?.[s.sector] || 0,
      })),
      paretoFront:  pareto_front  || mlData.pareto_front  || [],
      shapValues:   shap_values   || mlData.shap_values   || {},
      meta: { source: 'ml', totalBudget, population },
    }
  }

  // If ML only returns allocations dict, build analysis from it
  if (allocations && typeof allocations === 'object') {
    const fractions = allocations
    return {
      allocations: fractions,
      sectorAnalysis: Object.entries(fractions).map(([sector, fraction]) => {
        const urgency = Math.round(fraction * 200) // heuristic
        return {
          sector,
          fraction,
          urgencyScore:   urgency,
          efficiencyScore: 60,
          priority:        urgency > 70 ? 'HIGH' : urgency > 45 ? 'MEDIUM' : 'LOW',
          changeFromPrev:  0,
          explanation:     `${sector} received ${(fraction * 100).toFixed(1)}% via NSGA-II ML optimization.`,
          shortReason:     `ML-optimized (NSGA-II)`,
          factors:         [],
          projectedOutcome: `Projected impact from ${(fraction * 100).toFixed(1)}% allocation to ${sector}.`,
          icon:            ICONS[sector] || '📌',
          shapValue:       shap_values?.[sector] || fractions[sector],
        }
      }).sort((a, b) => b.fraction - a.fraction),
      paretoFront: pareto_front  || mlData.pareto_front  || [],
      shapValues:  shap_values   || mlData.shap_values   || {},
      meta: { source: 'ml', totalBudget, population },
    }
  }

  return null
}

// ─── POST /api/allocation/optimize ───────────────────────────────────────────
exports.optimize = async (req, res) => {
  try {
    const { regionId, totalBudget, population, gdp, sectorInputs, districtId } = req.body

    if (!totalBudget || totalBudget <= 0)
      return res.status(400).json({ message: 'totalBudget must be a positive number' })

    let result = null
    let source = 'builtin'

    // ── Try ML service first ──────────────────────────────────────────────────
    try {
      const mlRegionId = districtId || regionId
      const mlData = await callML('post', '/optimize', {
        region_id:    mlRegionId,
        total_budget: Number(totalBudget),
      })
      result = mlOptimizeToAnalysis(mlData, Number(totalBudget), population)
      if (result) source = 'ml'
    } catch (mlErr) {
      console.warn('ML service unavailable, using built-in optimizer:', mlErr.message)
    }

    // ── Fallback to built-in optimizer ────────────────────────────────────────
    if (!result) {
      const region = await Region.findOne({ regionId })
      const sectorIndicators = region?.sectorIndicators
        ? (region.sectorIndicators.toObject ? region.sectorIndicators.toObject() : region.sectorIndicators)
        : {}

      if (sectorInputs && typeof sectorInputs === 'object') {
        for (const [sector, vals] of Object.entries(sectorInputs)) {
          sectorIndicators[sector] = { ...(sectorIndicators[sector] || {}), ...vals }
        }
      }

      result = computeAllocation(
        sectorIndicators,
        Number(totalBudget),
        population || region?.population || 10000000,
        gdp        || region?.gdp        || 5000000000
      )
      source = 'builtin'
    }

    // ── Compute changeFromPrev ────────────────────────────────────────────────
    const prev = await Allocation.findOne({ regionId }).sort({ createdAt: -1 })
    if (prev?.allocations) {
      const prevMap = Object.fromEntries(prev.allocations)
      result.sectorAnalysis = result.sectorAnalysis.map(s => ({
        ...s,
        changeFromPrev: prevMap[s.sector] != null
          ? parseFloat(((s.fraction - prevMap[s.sector]) * 100).toFixed(2))
          : 0,
      }))
    }

    result.meta = { ...(result.meta || {}), source, optimizedAt: new Date().toISOString() }
    res.json(result)
  } catch (err) {
    console.error('optimize error:', err)
    res.status(500).json({ message: 'Optimization failed', error: err.message })
  }
}

// ─── POST /api/allocation/simulate ───────────────────────────────────────────
exports.simulate = async (req, res) => {
  try {
    const { regionId, sector, changePercent, totalBudget, districtId } = req.body

    if (!sector || changePercent == null)
      return res.status(400).json({ message: 'sector and changePercent are required' })

    const budget = Number(totalBudget) || 1_000_000_000
    const pct    = Number(changePercent)

    let result = null

    // ── Try ML simulate endpoint ──────────────────────────────────────────────
    try {
      const mlData = await callML('post', '/simulate', {
        region_id:      districtId || regionId,
        sector,
        change_percent: pct,
      })

      // Log raw ML response to debug
      console.log('ML simulate raw response:', JSON.stringify(mlData).slice(0, 500))

      // The real ML service returns:
      // { ripple: { Welfare: 2.5 }, explanations: [...], projection: [{year, baseline, simulated}] }
      // It does NOT return base/simulated allocations — we compute those from built-in + overlay

      // Get base fractions from last saved allocation or run built-in
      const latestForBase = await Allocation.findOne({ regionId }).sort({ createdAt: -1 })
      let baseFractions = {}
      if (latestForBase?.allocations) {
        baseFractions = Object.fromEntries(latestForBase.allocations)
      } else {
        const region = await Region.findOne({ regionId })
        const si = region?.sectorIndicators
          ? (region.sectorIndicators.toObject ? region.sectorIndicators.toObject() : region.sectorIndicators)
          : {}
        baseFractions = computeAllocation(si, budget).allocations
      }

      // Apply the requested change to build simulated fractions
      const builtinSim = simulateChange(baseFractions, sector, pct, budget)
      const simFractions = builtinSim.simulatedAllocations

      // Extract ripple effects from ML — ripple is a dict { sector: change_pct }
      const rawRipple = mlData.ripple || mlData.ripple_effects || mlData.rippleEffects || {}
      let rippleEffects = []

      if (typeof rawRipple === 'object' && !Array.isArray(rawRipple)) {
        // Dict format: { Welfare: 2.5, Education: -1.2 }
        rippleEffects = Object.entries(rawRipple)
          .filter(([sec]) => sec !== sector)
          .map(([sec, changePct]) => {
            const change = safeNumBackend(changePct, 0)
            const simFrac = safeNumBackend(simFractions[sec], 0)
            return {
              sector:    sec,
              change:    parseFloat(change.toFixed(2)),
              newAmount: parseFloat((simFrac * budget / 1e7).toFixed(2)),
            }
          })
          .filter(r => r.sector && Math.abs(r.change) > 0.01)
      } else if (Array.isArray(rawRipple)) {
        rippleEffects = rawRipple.map(r => ({
          sector:    String(r.sector || r.name || ''),
          change:    safeNumBackend(r.change ?? r.change_percent ?? r.effect_pct ?? 0, 0),
          newAmount: safeNumBackend(r.new_amount ?? r.newAmount ?? 0, 0),
        })).filter(r => r.sector && Math.abs(r.change) > 0.01)
      }

      // Also extract from explanations if available
      if (rippleEffects.length === 0 && Array.isArray(mlData.explanations)) {
        rippleEffects = mlData.explanations.map(e => ({
          sector:    String(e.to || ''),
          change:    safeNumBackend(e.effect_pct ?? 0, 0),
          newAmount: parseFloat((safeNumBackend(simFractions[e.to] ?? 0, 0) * budget / 1e7).toFixed(2)),
        })).filter(r => r.sector && Math.abs(r.change) > 0.01)
      }

      // Build projection string from ML projection array if available
      let projection = ''
      if (Array.isArray(mlData.projection) && mlData.projection.length > 0) {
        const first = mlData.projection[0]
        const last  = mlData.projection[mlData.projection.length - 1]
        projection = `HDI impact: Baseline ${first.baseline} → Simulated ${last.simulated} by ${last.year}. +${pct}% ${sector} investment.`
      } else if (typeof mlData.projection === 'string') {
        projection = mlData.projection
      }
      if (!projection) {
        projection = `${pct > 0 ? '+' : ''}${pct}% ${sector} → coverage gap closes by ${(Math.abs(pct) * 0.6).toFixed(1)}%`
      }

      result = {
        targetSector:         sector,
        changePercent:        pct,
        baseAllocations:      baseFractions,
        simulatedAllocations: simFractions,
        rippleEffects,
        projection,
        mlExplanations:       mlData.explanations || [],
        mlProjection:         Array.isArray(mlData.projection) ? mlData.projection : [],
        meta:                 { source: 'ml' },
      }
    } catch (mlErr) {
      console.warn('ML simulate unavailable, using built-in:', mlErr.message)
    }


    // ── Fallback to built-in ──────────────────────────────────────────────────
    if (!result) {
      const latest = await Allocation.findOne({ regionId }).sort({ createdAt: -1 })
      let currentFractions = {}
      if (latest?.allocations) {
        currentFractions = Object.fromEntries(latest.allocations)
      } else {
        const region = await Region.findOne({ regionId })
        const si = region?.sectorIndicators
          ? (region.sectorIndicators.toObject ? region.sectorIndicators.toObject() : region.sectorIndicators)
          : {}
        currentFractions = computeAllocation(si, budget).allocations
      }
      result = simulateChange(currentFractions, sector, pct, budget)
    }

    // ── Final safety pass: strip NaN from ALL numeric fields ─────────────────
    const clean = (v, fallback = 0) => {
      const n = parseFloat(v)
      return isNaN(n) ? fallback : parseFloat(n.toFixed(4))
    }
    const sanitizedBase = {}
    const sanitizedSim  = {}
    for (const [k, v] of Object.entries(result.baseAllocations || {})) {
      sanitizedBase[k] = clean(v)
    }
    for (const [k, v] of Object.entries(result.simulatedAllocations || {})) {
      sanitizedSim[k] = clean(v)
    }
    result.baseAllocations      = sanitizedBase
    result.simulatedAllocations = sanitizedSim
    result.rippleEffects = (result.rippleEffects || []).map(r => ({
      sector:    r.sector || '',
      change:    clean(r.change, 0),
      newAmount: clean(r.newAmount, 0),
    })).filter(r => r.sector)

    res.json(result)
  } catch (err) {
    console.error('simulate error:', err)
    res.status(500).json({ message: 'Simulation failed', error: err.message })
  }
}




// ─── POST /api/allocation/save ────────────────────────────────────────────────
exports.save = async (req, res) => {
  try {
    const { regionId, totalBudget, allocations, paretoFront, shapValues } = req.body
    const doc = await Allocation.create({
      regionId, totalBudget, allocations, paretoFront, shapValues,
      createdBy: req.user._id, status: 'draft',
    })
    res.status(201).json(doc)
  } catch (err) {
    console.error('save error:', err)
    res.status(500).json({ message: 'Save failed', error: err.message })
  }
}

// ─── GET /api/allocation/history/:regionId ────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const docs = await Allocation.find({ regionId: req.params.regionId }).sort({ createdAt: -1 }).limit(10)
    res.json(docs)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history' })
  }
}

// ─── PUT /api/allocation/publish/:id ─────────────────────────────────────────
exports.publish = async (req, res) => {
  try {
    const doc = await Allocation.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Allocation not found' })
    doc.status = 'published'
    await doc.save()
    res.json({ message: 'Allocation published', doc })
  } catch (err) {
    res.status(500).json({ message: 'Publish failed' })
  }
}