const mongoose = require('mongoose')

const regionSchema = new mongoose.Schema({
  regionId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['state', 'district', 'municipal', 'panchayat', 'central'] },
  parent: { type: String },
  population: Number,
  gdp: Number,
  sectorIndicators: {
    healthcare: { urgencyScore: Number, currentSpend: Number, coverageGap: Number },
    education: { urgencyScore: Number, currentSpend: Number, coverageGap: Number },
    infrastructure: { urgencyScore: Number, currentSpend: Number, coverageGap: Number },
    agriculture: { urgencyScore: Number, currentSpend: Number, coverageGap: Number },
    welfare: { urgencyScore: Number, currentSpend: Number, coverageGap: Number },
  }
}, { timestamps: true })

module.exports = mongoose.model('Region', regionSchema)