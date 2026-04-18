const Report = require('../models/Report')
const Allocation = require('../models/Allocation')
const Scenario = require('../models/Scenario')
const User = require('../models/User')
const { sendReportEmail } = require('../config/mailer')

// ─── Generate & Save a Report ────────────────────────────────────────────────
exports.generateReport = async (req, res) => {
  try {
    const {
      regionId, regionName, fiscalYear, type,
      totalBudget, allocations, sectorImpacts,
      previousAllocations, paretoStrategy, title, summary
    } = req.body

    // Compute allocation deltas vs previous year
    const allocationDelta = {}
    if (previousAllocations && allocations) {
      for (const sector of Object.keys(allocations)) {
        const curr = allocations[sector] || 0
        const prev = previousAllocations[sector] || 0
        allocationDelta[sector] = prev === 0 ? 0 : parseFloat(((curr - prev) / prev * 100).toFixed(2))
      }
    }

    const report = await Report.create({
      regionId,
      regionName,
      generatedBy: req.user._id,
      fiscalYear: fiscalYear || '2024-25',
      type: type || 'allocation',
      title: title || `Budget Allocation Report — ${regionName} — FY ${fiscalYear || '2024-25'}`,
      summary: summary || `Optimal budget allocation generated for ${regionName} using NSGA-II multi-objective optimization.`,
      totalBudget,
      allocations,
      sectorImpacts,
      previousAllocations,
      allocationDelta,
      paretoStrategy,
      isPublic: false,
    })

    res.status(201).json({ message: 'Report generated', report })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to generate report', error: err.message })
  }
}

// ─── Get All Reports for a Region ────────────────────────────────────────────
exports.getReportsByRegion = async (req, res) => {
  try {
    const reports = await Report.find({ regionId: req.params.regionId })
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20)
    res.json(reports)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reports' })
  }
}

// ─── Get Single Report ────────────────────────────────────────────────────────
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('generatedBy', 'name email')
    if (!report) return res.status(404).json({ message: 'Report not found' })

    // Citizens can only see public reports
    if (req.user.role === 'citizen' && !report.isPublic)
      return res.status(403).json({ message: 'This report is not yet public' })

    res.json(report)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch report' })
  }
}

// ─── Publish Report (make citizen-visible) ───────────────────────────────────
exports.publishReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found' })
    if (report.regionId !== req.user.regionId && req.user.role !== 'superadmin')
      return res.status(403).json({ message: 'Not authorized for this region' })

    report.isPublic = true
    await report.save()
    res.json({ message: 'Report published to citizens', report })
  } catch (err) {
    res.status(500).json({ message: 'Failed to publish report' })
  }
}

// ─── Delete Report ────────────────────────────────────────────────────────────
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found' })
    if (report.generatedBy.toString() !== req.user._id.toString() && req.user.role !== 'superadmin')
      return res.status(403).json({ message: 'Not authorized' })
    await report.deleteOne()
    res.json({ message: 'Report deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete report' })
  }
}

// ─── Email Report to Admin ────────────────────────────────────────────────────
exports.emailReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('generatedBy', 'name email')
    if (!report) return res.status(404).json({ message: 'Report not found' })

    await sendReportEmail(req.user.email, req.user.name, report)
    res.json({ message: `Report emailed to ${req.user.email}` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to send email' })
  }
}

// ─── Save Scenario ────────────────────────────────────────────────────────────
exports.saveScenario = async (req, res) => {
  try {
    const {
      regionId, name, description, sector, changePercent,
      baseAllocations, simulatedAllocations, projection, rippleEffects
    } = req.body

    const scenario = await Scenario.create({
      regionId, name, description, sector, changePercent,
      baseAllocations, simulatedAllocations, projection, rippleEffects,
      createdBy: req.user._id,
      status: 'saved'
    })

    res.status(201).json({ message: 'Scenario saved', scenario })
  } catch (err) {
    res.status(500).json({ message: 'Failed to save scenario', error: err.message })
  }
}

// ─── Get Scenarios for Region ─────────────────────────────────────────────────
exports.getScenarios = async (req, res) => {
  try {
    const scenarios = await Scenario.find({ regionId: req.params.regionId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
    res.json(scenarios)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch scenarios' })
  }
}

// ─── Compare Two Allocations ──────────────────────────────────────────────────
exports.compareAllocations = async (req, res) => {
  try {
    const { allocationIdA, allocationIdB } = req.body
    const [a, b] = await Promise.all([
      Allocation.findById(allocationIdA),
      Allocation.findById(allocationIdB)
    ])
    if (!a || !b) return res.status(404).json({ message: 'One or both allocations not found' })

    const aMap = Object.fromEntries(a.allocations)
    const bMap = Object.fromEntries(b.allocations)
    const sectors = [...new Set([...Object.keys(aMap), ...Object.keys(bMap)])]

    const comparison = sectors.map(sector => ({
      sector,
      allocationA: ((aMap[sector] || 0) * 100).toFixed(2),
      allocationB: ((bMap[sector] || 0) * 100).toFixed(2),
      delta: (((bMap[sector] || 0) - (aMap[sector] || 0)) * 100).toFixed(2),
    }))

    res.json({
      labelA: `Allocation from ${new Date(a.createdAt).toLocaleDateString()}`,
      labelB: `Allocation from ${new Date(b.createdAt).toLocaleDateString()}`,
      comparison
    })
  } catch (err) {
    res.status(500).json({ message: 'Comparison failed' })
  }
}