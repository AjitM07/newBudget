const axios    = require('axios')
const Region   = require('../models/Region')
const { computeSectorNeeds, DEFAULT_INDICATORS } = require('../utils/optimizer')

const ML_URL = process.env.ML_SERVICE_URL || 'https://newbudget-ml.onrender.com'
const SECTOR_ICONS = { Healthcare: '🏥', Education: '📚', Infrastructure: '🏗️', Agriculture: '🌾', Welfare: '🤝' }

// ─── GET /api/dashboard/sector-needs/:regionId ───────────────────────────────
exports.getSectorNeeds = async (req, res) => {
  try {
    // Try real ML forecast first
    try {
      const mlRes = await axios.get(`${ML_URL}/forecast/${req.params.regionId}`, { timeout: 12000 })
      const data  = mlRes.data
      if (Array.isArray(data) && data.length > 0) {
        return res.json(data.map(d => ({
          sector:       d.sector,
          urgencyScore: Math.round(d.urgencyScore),
          coverageGap:  d.forecastedNeed,
          currentSpend: 0.05,
          trend:        d.trend || 0,
          status:       d.urgencyScore > 70 ? 'critical' : d.urgencyScore > 45 ? 'underfunded' : 'stable',
          reason:       `ML urgency: ${d.urgencyScore.toFixed(1)}/100 · Need index: ${(d.forecastedNeed * 100).toFixed(0)}%`,
          icon:         SECTOR_ICONS[d.sector] || '📌',
          source:       'ml',
        })))
      }
    } catch (mlErr) {
      console.warn('ML forecast unavailable, using built-in:', mlErr.message)
    }

    // Fallback: built-in from Region DB data
    const region = await Region.findOne({ regionId: req.params.regionId })
    const sectorIndicators = region?.sectorIndicators
      ? (region.sectorIndicators.toObject ? region.sectorIndicators.toObject() : region.sectorIndicators)
      : {}
    const needs = computeSectorNeeds(sectorIndicators)
    res.json(needs.map(n => ({ ...n, source: 'builtin' })))
  } catch (err) {
    console.error('getSectorNeeds error:', err)
    res.status(500).json({ message: 'Failed to compute sector needs' })
  }
}

// ─── GET /api/dashboard/kpis/:regionId ───────────────────────────────────────
exports.getKPIs = async (req, res) => {
  try {
    const region = await Region.findOne({ regionId: req.params.regionId })
    const pop    = region?.population  || 10_000_000
    const gdp    = region?.gdp         || 5_000_000_000
    const si     = region?.sectorIndicators || {}

    const healthUrgency  = si.healthcare?.urgencyScore     ?? DEFAULT_INDICATORS.Healthcare.urgencyScore
    const eduUrgency     = si.education?.urgencyScore      ?? DEFAULT_INDICATORS.Education.urgencyScore
    const infraUrgency   = si.infrastructure?.urgencyScore ?? DEFAULT_INDICATORS.Infrastructure.urgencyScore

    const healthCoverage = 1 - (si.healthcare?.coverageGap     ?? DEFAULT_INDICATORS.Healthcare.coverageGap)
    const eduCoverage    = 1 - (si.education?.coverageGap      ?? DEFAULT_INDICATORS.Education.coverageGap)
    const infraCoverage  = 1 - (si.infrastructure?.coverageGap ?? DEFAULT_INDICATORS.Infrastructure.coverageGap)

    const hdi       = ((healthCoverage * 0.5 + eduCoverage * 0.5) * 0.8 + 0.1).toFixed(3)
    const literacy  = Math.min(99, Math.round(eduCoverage * 85 + 10))
    const infraIdx  = Math.round(infraCoverage * 100)

    res.json([
      { key: 'population', label: 'Population',          value: pop >= 1e7 ? `${(pop/1e7).toFixed(1)} Cr` : `${(pop/1e5).toFixed(1)} L`,         trend: 1.2  },
      { key: 'gdp',        label: 'Regional GDP',        value: gdp >= 1e10 ? `₹${(gdp/1e10).toFixed(1)}K Cr` : `₹${(gdp/1e7).toFixed(1)} Cr`, trend: 4.2  },
      { key: 'hdi',        label: 'HDI Index (proxy)',   value: hdi,                                                                               trend: parseFloat(((1-healthUrgency/100 + 1-eduUrgency/100)*0.9).toFixed(1)) },
      { key: 'literacy',   label: 'Literacy Rate (est)', value: `${literacy}%`,                                                                   trend: parseFloat(((1-eduUrgency/100)*1.5).toFixed(1))   },
      { key: 'infra',      label: 'Infra Coverage',      value: `${infraIdx}/100`,                                                                trend: parseFloat(((1-infraUrgency/100)*-1.2).toFixed(1)) },
    ])
  } catch (err) {
    console.error('getKPIs error:', err)
    res.status(500).json({ message: 'Failed to compute KPIs' })
  }
}

// ─── GET /api/dashboard/comparisons ──────────────────────────────────────────
exports.getComparisons = async (req, res) => {
  try {
    const regions = await Region.find().limit(10)
    res.json(regions)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch regions' })
  }
}

// ─── PUT /api/dashboard/region/:regionId ─────────────────────────────────────
exports.updateRegionDataset = async (req, res) => {
  try {
    const { regionId }                    = req.params
    const { population, gdp, sectorIndicators } = req.body
    const update = {}
    if (population)       update.population       = Number(population)
    if (gdp)              update.gdp              = Number(gdp)
    if (sectorIndicators) update.sectorIndicators = sectorIndicators

    const region = await Region.findOneAndUpdate(
      { regionId },
      { $set: update },
      { new: true, upsert: true }
    )
    res.json({ message: 'Region dataset updated', region })
  } catch (err) {
    console.error('updateRegionDataset error:', err)
    res.status(500).json({ message: 'Failed to update region dataset' })
  }
}