const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'superadmin', 'citizen'], default: 'citizen' },
  govId: { type: String },
  regionType: { type: String },
  regionName: { type: String },
  regionId: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },  // superadmin approves admin
  otp: { type: String },
  otpExpiry: { type: Date },
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function(p) {
  return bcrypt.compare(p, this.password)
}

module.exports = mongoose.model('User', userSchema)