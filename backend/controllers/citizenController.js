const Allocation = require('../models/Allocation')

exports.getPublicRegionData = async (req, res) => {
  const latest = await Allocation.findOne({ regionId: req.params.regionId, status: 'published' }).sort({ createdAt: -1 })
  if (!latest) return res.json({ allocations: [], publicMetrics: [] })

  const allocs = Object.entries(Object.fromEntries(latest.allocations)).map(([sector, v]) => ({
    sector, value: (v * 100).toFixed(1)
  }))

  // Hide sensitive fields — only show public metrics
  res.json({
    allocations: allocs,
    publicMetrics: [
      { label: 'Total Budget Allocated', value: `₹${(latest.totalBudget / 1e7).toFixed(1)} Crore`, description: 'FY 2024-25' },
      { label: 'Top Priority Sector', value: allocs[0]?.sector || 'N/A', description: 'Highest urgency score' },
      { label: 'Fiscal Year', value: latest.fiscalYear, description: 'Current allocation cycle' },
    ]
  })
}