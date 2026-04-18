const Region = require('../models/Region')
const axios = require('axios')

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

exports.getSectorNeeds = async (req, res) => {
  const mlRes = await axios.get(`${ML_URL}/forecast/${req.params.regionId}`)
  res.json(mlRes.data)
}

exports.getKPIs = async (req, res) => {
  const region = await Region.findOne({ regionId: req.params.regionId })
  const kpis = [
    { key: 'gdp', label: 'GDP (₹ Crore)', value: region?.gdp ? `₹${(region.gdp/1e4).toFixed(1)}L Cr` : 'N/A', trend: 4.2 },
    { key: 'hdi', label: 'HDI Index', value: '0.645', trend: 1.3 },
    { key: 'literacy', label: 'Literacy Rate', value: '77.7%', trend: 0.8 },
    { key: 'infra', label: 'Infra Index', value: '58/100', trend: -0.5 },
  ]
  res.json(kpis)
}

exports.getComparisons = async (req, res) => {
  const regions = await Region.find().limit(10)
  res.json(regions)
}