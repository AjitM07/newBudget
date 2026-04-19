const User    = require('../models/User')
const Region  = require('../models/Region')
const jwt     = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const { DEFAULT_INDICATORS } = require('../utils/optimizer')

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'budgetos_secret', { expiresIn: '7d' })

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN REGISTER
// POST /api/auth/admin/register
// Body: { name, email, password, govId, regionName, regionType }
// ─────────────────────────────────────────────────────────────────────────────
exports.adminRegister = async (req, res) => {
  try {
    const { name, email, password, govId, regionName, regionType } = req.body

    // Basic validation
    if (!name || !email || !password || !govId) {
      return res.status(400).json({ message: 'Name, email, password and Govt ID are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }
    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Enter a valid email address' })
    }

    // Check duplicate
    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }

    const regionId = uuidv4()
    const user = await User.create({
      name,
      email,
      password,
      role:       'admin',
      govId,
      regionName: regionName || 'All India',
      regionType: regionType || 'Central',
      regionId,
    })

    // Auto-seed region dataset with realistic defaults
    const seedMultipliers = {
      'Central Ministry':      { population: 1_380_000_000, gdp: 300_000_000_000, urgencyMod: 0 },
      'State Government':      { population:  60_000_000,  gdp:  15_000_000_000, urgencyMod: 5 },
      'District Administration':{ population:  2_000_000,  gdp:     500_000_000, urgencyMod: 10 },
      'Municipal Corporation': { population:  1_000_000,  gdp:     200_000_000, urgencyMod: 8 },
      'Panchayat':             { population:     10_000,  gdp:       2_000_000, urgencyMod: 15 },
    }
    const seed = seedMultipliers[regionType] || seedMultipliers['State Government']
    const mod  = seed.urgencyMod

    await Region.findOneAndUpdate(
      { regionId },
      {
        regionId,
        name:       regionName || 'All India',
        type:       (regionType || 'state').toLowerCase().split(' ')[0],
        population: seed.population,
        gdp:        seed.gdp,
        sectorIndicators: {
          healthcare:     { urgencyScore: Math.min(100, 78 + mod), currentSpend: 0.05, coverageGap: 0.42 },
          education:      { urgencyScore: Math.min(100, 72 + mod), currentSpend: 0.06, coverageGap: 0.35 },
          infrastructure: { urgencyScore: Math.min(100, 65 + mod), currentSpend: 0.08, coverageGap: 0.28 },
          agriculture:    { urgencyScore: Math.min(100, 58 + mod), currentSpend: 0.04, coverageGap: 0.20 },
          welfare:        { urgencyScore: Math.min(100, 50 + mod), currentSpend: 0.03, coverageGap: 0.15 },
        },
      },
      { upsert: true, new: true }
    )

    const token = signToken({ id: user._id, role: user.role })

    return res.status(201).json({
      message: 'Admin account created successfully',
      token,
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        govId:      user.govId,
        regionId:   user.regionId,
        region:     user.regionName,
        regionType: user.regionType,
      },
    })
  } catch (err) {
    console.error('adminRegister error:', err.message)
    return res.status(500).json({ message: 'Registration failed. Please try again.' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LOGIN
// POST /api/auth/admin/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────────────────────
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email, role: 'admin' })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const match = await user.comparePassword(password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = signToken({ id: user._id, role: user.role })

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        govId:      user.govId,
        regionId:   user.regionId,
        region:     user.regionName,
        regionType: user.regionType,
      },
    })
  } catch (err) {
    console.error('adminLogin error:', err.message)
    return res.status(500).json({ message: 'Login failed. Please try again.' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CITIZEN REGISTER
// POST /api/auth/citizen/register
// Body: { name, email, password }
// ─────────────────────────────────────────────────────────────────────────────
exports.citizenRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }
    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Enter a valid email address' })
    }

    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }

    const user = await User.create({ name, email, password, role: 'citizen' })
    const token = signToken({ id: user._id, role: user.role })

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    })
  } catch (err) {
    console.error('citizenRegister error:', err.message)
    return res.status(500).json({ message: 'Registration failed. Please try again.' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CITIZEN LOGIN
// POST /api/auth/citizen/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────────────────────
exports.citizenLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email, role: 'citizen' })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const match = await user.comparePassword(password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = signToken({ id: user._id, role: user.role })

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    })
  } catch (err) {
    console.error('citizenLogin error:', err.message)
    return res.status(500).json({ message: 'Login failed. Please try again.' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ME — works for both admin and citizen
// GET /api/auth/me
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.json(user)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get user' })
  }
}
