const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true, trim: true },
    email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:        { type: String, required: true },
    role:            { type: String, enum: ['admin', 'superadmin', 'citizen'], default: 'citizen' },
    govId:           { type: String, default: '' },
    regionType:      { type: String, default: '' },
    regionName:      { type: String, default: '' },
    regionId:        { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    isApproved:      { type: Boolean, default: true },
    otp:             { type: String },
    otpExpiry:       { type: Date },
  },
  { timestamps: true }
)

// ── Hash password before saving ────────────────────────────────────────────
// Pure async, NO callback parameter — Mongoose 6+ uses the returned Promise
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

// ── Compare password helper ────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
