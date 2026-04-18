const crypto = require('crypto')

/**
 * Generates a cryptographically secure 6-digit OTP string
 */
const generateOTP = () => {
  // randomInt(min, max) — max is exclusive, so 999999+1 = 1000000
  return crypto.randomInt(100000, 1000000).toString()
}

module.exports = generateOTP