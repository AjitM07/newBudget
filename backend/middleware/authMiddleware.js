const { verifyToken } = require('../utils/tokenUtils')
const User = require('../models/User')

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' })
  try {
    const decoded = verifyToken(auth.split(' ')[1])
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) return res.status(401).json({ message: 'User not found' })
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}