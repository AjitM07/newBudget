const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
  regionId: { type: String, required: true },
  regionName: { type: String },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fiscalYear: { type: String, default: '2024-25' },
  type: {
    type: String,
    enum: ['allocation', 'simulation', 'comparison', 'impact'],
    default: 'allocation'
  },
  title: { type: String, required: true },
  summary: { type: String },

  // Core allocation snapshot
  totalBudget: { type: Number },
  allocations: { type: Map, of: Number },

  // Sector-wise impact details
  sectorImpacts: [{
    sector: String,
    allocated: Number,          // fraction
    allocatedAmount: Number,    // in rupees
    urgencyScore: Number,
    projectedOutcome: String,
    shapExplanation: String,    // plain-english reason
  }],

  // Comparison with previous year
  previousAllocations: { type: Map, of: Number },
  allocationDelta: { type: Map, of: Number },   // sector -> % change

  // Pareto metadata
  paretoStrategy: {
    hdi: Number,
    gini: Number,
    shock: Number
  },

  // Visibility
  isPublic: { type: Boolean, default: false },   // citizen-visible
  pdfUrl: { type: String },                       // optional stored PDF

}, { timestamps: true })

module.exports = mongoose.model('Report', reportSchema)