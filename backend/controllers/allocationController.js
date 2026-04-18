const axios = require('axios')
const Allocation = require('../models/Allocation')

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

exports.optimize = async (req, res) => {
  const { regionId, totalBudget } = req.body
  const mlRes = await axios.post(`${ML_URL}/optimize`, { region_id: regionId, total_budget: totalBudget })
  res.json(mlRes.data)
}

exports.simulate = async (req, res) => {
  const { regionId, sector, changePercent } = req.body
  const mlRes = await axios.post(`${ML_URL}/simulate`, { region_id: regionId, sector, change_percent: changePercent })
  res.json(mlRes.data)
}

exports.save = async (req, res) => {
  const { regionId, totalBudget, allocations, paretoFront, shapValues } = req.body
  const doc = await Allocation.create({ regionId, totalBudget, allocations, paretoFront, shapValues, createdBy: req.user._id })
  res.status(201).json(doc)
}

exports.getHistory = async (req, res) => {
  const docs = await Allocation.find({ regionId: req.params.regionId }).sort({ createdAt: -1 }).limit(10)
  res.json(docs)
}