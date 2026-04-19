const Allocation = require('../models/Allocation')
const Region     = require('../models/Region')
const { computeSectorNeeds } = require('../utils/optimizer')

// ─── GET /api/citizen/region/:regionId ───────────────────────────────────────
// Returns rich public budget data for the citizen dashboard
exports.getPublicRegionData = async (req, res) => {
  try {
    const { regionId } = req.params
    const latest = await Allocation
      .findOne({ regionId, status: 'published' })
      .sort({ createdAt: -1 })

    const region = await Region.findOne({ regionId })
    const sectorIndicators = region?.sectorIndicators
      ? (region.sectorIndicators.toObject ? region.sectorIndicators.toObject() : region.sectorIndicators)
      : {}

    const sectorNeeds = computeSectorNeeds(sectorIndicators)

    if (!latest) {
      // Return sector needs from region data even if no published allocation
      return res.json({
        hasData: false,
        regionName: region?.name || 'Your Region',
        allocations: [],
        publicMetrics: [],
        sectorNeeds,
      })
    }

    const allocMap = Object.fromEntries(latest.allocations)
    const shapMap  = latest.shapValues ? Object.fromEntries(latest.shapValues) : {}

    // Build per-sector allocation data
    const allocations = Object.entries(allocMap).map(([sector, fraction]) => {
      const pct    = parseFloat((fraction * 100).toFixed(1))
      const amt    = parseFloat((fraction * latest.totalBudget / 1e7).toFixed(2)) // in Crores
      const need   = sectorNeeds.find(n => n.sector.toLowerCase() === sector.toLowerCase())
      const impact = shapMap[sector] != null
        ? parseFloat((shapMap[sector] * 10).toFixed(1))
        : (need ? parseFloat((need.urgencyScore / 10).toFixed(1)) : 5.0)

      return {
        sector,
        value:  pct,
        amount: amt,
        impact,
        urgencyScore: need?.urgencyScore || 60,
        coverageGap:  need?.coverageGap  || 0.3,
        status:       need?.status || 'stable',
        icon:         need?.icon || '📌',
      }
    }).sort((a, b) => b.value - a.value)

    // Previous allocation for year-on-year delta
    const prev = await Allocation
      .findOne({ regionId, status: 'published', _id: { $ne: latest._id } })
      .sort({ createdAt: -1 })
    const prevMap = prev ? Object.fromEntries(prev.allocations) : {}

    const allocationDelta = allocations.map(a => ({
      sector: a.sector,
      change: prevMap[a.sector] != null
        ? parseFloat(((a.value / 100 - prevMap[a.sector]) * 100).toFixed(2))
        : null,
    }))

    // Top sector by allocation
    const topSector = allocations[0]?.sector || 'N/A'

    const publicMetrics = [
      {
        label:       'Total Budget',
        value:       `₹${(latest.totalBudget / 1e7).toFixed(1)} Cr`,
        description: `FY ${latest.fiscalYear || '2024-25'}`,
        icon:        '💰',
      },
      {
        label:       'Top Funded Sector',
        value:       topSector,
        description: `${allocations[0]?.value || 0}% of total budget`,
        icon:        '🏆',
      },
      {
        label:       'Region',
        value:       region?.name || 'All India',
        description: region?.type ? region.type.charAt(0).toUpperCase() + region.type.slice(1) : 'Government',
        icon:        '📍',
      },
      {
        label:       'Population Covered',
        value:       region?.population ? (region.population >= 1e7 ? `${(region.population / 1e7).toFixed(1)} Cr` : `${(region.population / 1e5).toFixed(1)} L`) : 'N/A',
        description: 'Estimated beneficiaries',
        icon:        '👥',
      },
    ]

    res.json({
      hasData:         true,
      regionName:      region?.name || 'All India',
      fiscalYear:      latest.fiscalYear || '2024-25',
      totalBudget:     latest.totalBudget,
      allocations,
      publicMetrics,
      sectorNeeds,
      allocationDelta,
      publishedAt:     latest.updatedAt,
    })
  } catch (err) {
    console.error('getPublicRegionData error:', err)
    res.status(500).json({ message: 'Failed to fetch public data' })
  }
}