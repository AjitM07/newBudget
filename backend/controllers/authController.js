const User = require('../models/User')
const generateOTP = require('../utils/generateOTP')
const { sendOTPEmail, sendApprovalEmail, sendRejectionEmail } = require('../config/mailer')
const { signToken } = require('../utils/tokenUtils')
const { v4: uuidv4 } = require('uuid')

exports.register = async (req, res) => {
  const { name, email, password, govId, regionType, regionName } = req.body
  if (!email.endsWith('.gov.in') && !email.endsWith('.nic.in'))
    return res.status(400).json({ message: 'Only official .gov.in or .nic.in emails allowed' })
  if (await User.findOne({ email }))
    return res.status(400).json({ message: 'Email already registered' })
  const otp = generateOTP()
  const user = await User.create({
    name, email, password, govId, regionType, regionName,
    regionId: uuidv4(), role: 'admin',
    otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
  })
  await sendOTPEmail(email, otp)
  res.status(201).json({ message: 'OTP sent to email' })
}

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body
  const user = await User.findOne({ email })
  if (!user || user.otp !== otp || user.otpExpiry < Date.now())
    return res.status(400).json({ message: 'Invalid or expired OTP' })
  user.isEmailVerified = true
  user.otp = undefined
  user.otpExpiry = undefined
  await user.save()
  res.json({ message: 'Email verified. Awaiting superadmin approval.' })
}

exports.login = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email, role: { $in: ['admin', 'superadmin'] } })
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' })
  if (!user.isEmailVerified)
    return res.status(403).json({ message: 'Email not verified' })
  if (!user.isApproved)
    return res.status(403).json({ message: 'Account pending superadmin approval' })
  const token = signToken({ id: user._id, role: user.role })
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, regionId: user.regionId, region: user.regionName } })
}

exports.citizenLogin = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email, role: 'citizen' })
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' })
  const token = signToken({ id: user._id, role: 'citizen' })
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: 'citizen', region: user.regionName } })
}

exports.getMe = async (req, res) => res.json(req.user)

exports.approveAdmin = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true })
  await sendApprovalEmail(user.email, user.name)
  res.json({ message: 'Admin approved', user })
}