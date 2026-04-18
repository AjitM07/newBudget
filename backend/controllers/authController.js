////// authController.js

const User = require('../models/User')
const generateOTP = require('../utils/generateOTP')
const { sendOTPEmail, sendApprovalEmail, sendRejectionEmail } = require('../config/mailer')
const { signToken } = require('../utils/tokenUtils')
const { v4: uuidv4 } = require('uuid')

// ── Register Admin ─────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, govId, regionType, regionName } = req.body

    // Validate required fields
    if (!name || !email || !password || !govId || !regionType || !regionName) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Enforce official email — TEMPORARILY relaxed for testing
    // Re-enable this check in production:
    // if (!email.endsWith('.gov.in') && !email.endsWith('.nic.in')) {
    //   return res.status(400).json({ message: 'Only official .gov.in or .nic.in emails allowed' })
    // }

    // Check duplicate
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create user (password hashed by pre-save hook in User model)
    const user = await User.create({
      name,
      email,
      password,
      govId,
      regionType,
      regionName,
      regionId: uuidv4(),
      role: 'admin',
      otp,
      otpExpiry,
      isEmailVerified: false,
      isApproved: true,
    })

    // Send OTP email — if email fails, still return success so user can see OTP in logs
    try {
      await sendOTPEmail(email, otp)
    } catch (emailErr) {
      console.error('Email send failed (OTP printed below for dev):', emailErr.message)
      console.log(`\n>>> DEV OTP for ${email}: ${otp} <<<\n`)
    }

    res.status(201).json({
      message: 'Registration successful. OTP sent to your email.',
      // Remove this in production — only for development:
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: err.message || 'Registration failed' })
  }
}

// ── Verify OTP ─────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' })
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' })
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please re-register.' })
    }

    user.isEmailVerified = true
    user.otp = undefined
    user.otpExpiry = undefined
    await user.save()

    res.json({ message: 'Email verified successfully. You can now log in.' })
  } catch (err) {
    console.error('VerifyOTP error:', err)
    res.status(500).json({ message: err.message || 'Verification failed' })
  }
}

// ── Admin Login ────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({
      email,
      role: { $in: ['admin', 'superadmin'] },
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const passwordMatch = await user.comparePassword(password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Email not verified. Check your inbox for OTP.' })
    }

    // if (!user.isApproved) {
    //   return res.status(403).json({
    //     message: 'Account pending superadmin approval. You will receive an email once approved.',
    //   })
    // }

    const token = signToken({ id: user._id, role: user.role })

    res.json({
      token,
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        regionId:   user.regionId,
        region:     user.regionName,
        regionType: user.regionType,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: err.message || 'Login failed' })
  }
}

// ── Citizen Login ──────────────────────────────────────────────────────────
exports.citizenLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email, role: 'citizen' })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const passwordMatch = await user.comparePassword(password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken({ id: user._id, role: 'citizen' })

    res.json({
      token,
      user: {
        id:     user._id,
        name:   user.name,
        email:  user.email,
        role:   'citizen',
        region: user.regionName,
      },
    })
  } catch (err) {
    console.error('Citizen login error:', err)
    res.status(500).json({ message: err.message || 'Login failed' })
  }
}

// ── Get Current User ───────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    res.json(req.user)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user' })
  }
}

// ── Approve Admin (superadmin only) ───────────────────────────────────────
exports.approveAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    try {
      await sendApprovalEmail(user.email, user.name)
    } catch (emailErr) {
      console.error('Approval email failed:', emailErr.message)
    }

    res.json({ message: 'Admin approved successfully', user })
  } catch (err) {
    console.error('Approve error:', err)
    res.status(500).json({ message: err.message || 'Approval failed' })
  }
}

// ── Reject Admin (superadmin only) ────────────────────────────────────────
exports.rejectAdmin = async (req, res) => {
  try {
    const { reason } = req.body
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    try {
      await sendRejectionEmail(user.email, user.name, reason)
    } catch (emailErr) {
      console.error('Rejection email failed:', emailErr.message)
    }

    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'Admin rejected and removed' })
  } catch (err) {
    console.error('Reject error:', err)
    res.status(500).json({ message: err.message || 'Rejection failed' })
  }
}

// ── List Pending Admins (superadmin only) ─────────────────────────────────
exports.getPendingAdmins = async (req, res) => {
  try {
    const pending = await User.find({
      role: 'admin',
      isEmailVerified: true,
      isApproved: false,
    }).select('-password -otp')

    res.json(pending)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending admins' })
  }
}

// ── Create Superadmin (one-time seed, disable after use) ──────────────────
exports.createSuperAdmin = async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body

    if (secretKey !== process.env.SUPERADMIN_SECRET) {
      return res.status(403).json({ message: 'Invalid secret key' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const superadmin = await User.create({
      name,
      email,
      password,
      role: 'superadmin',
      regionId: 'NATIONAL',
      regionName: 'All India',
      regionType: 'Central Ministry',
      govId: 'SUPERADMIN',
      isEmailVerified: true,
      isApproved: true,
    })

    res.status(201).json({
      message: 'Superadmin created',
      user: { id: superadmin._id, email: superadmin.email },
    })
  } catch (err) {
    console.error('Superadmin create error:', err)
    res.status(500).json({ message: err.message || 'Failed' })
  }
}