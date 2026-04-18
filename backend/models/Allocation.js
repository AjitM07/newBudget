const mongoose = require('mongoose')

const allocationSchema = new mongoose.Schema({
  regionId: { type: String, required: true },
  fiscalYear: { type: String, default: '2024-25' },
  totalBudget: { type: Number, required: true },
  allocations: { type: Map, of: Number },   // { Healthcare: 0.23, ... }
  paretoFront: [{ hdi: Number, gini: Number, roi: Number, allocations: Object }],
  shapValues: { type: Map, of: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'approved', 'published'], default: 'draft' },
}, { timestamps: true })

module.exports = mongoose.model('Allocation', allocationSchema)