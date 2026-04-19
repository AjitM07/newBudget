const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true },
    role:       { type: String, enum: ['admin', 'citizen'], default: 'citizen' },

    // Admin only
    govId:      { type: String, default: '' },
    regionName: { type: String, default: 'All India' },
    regionType: { type: String, default: 'Central' },
    regionId:   { type: String, default: 'default' },
  },
  { timestamps: true }
)

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

// Compare password
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('User', userSchema)
