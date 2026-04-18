const mongoose = require('mongoose')

const scenarioSchema = new mongoose.Schema({
  regionId: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  description: { type: String },
  sector: { type: String, required: true },
  changePercent: { type: Number, required: true },
  baseAllocations: { type: Map, of: Number },
  simulatedAllocations: { type: Map, of: Number },
  projection: [{
    year: Number,
    baseline: Number,
    simulated: Number
  }],
  rippleEffects: { type: Map, of: Number },
  status: { type: String, enum: ['draft', 'saved', 'applied'], default: 'saved' },
}, { timestamps: true })

module.exports = mongoose.model('Scenario', scenarioSchema)