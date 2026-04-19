const router = require('express').Router()
const ctrl   = require('../controllers/authController')
const auth   = require('../middleware/authMiddleware')

// Admin
router.post('/admin/register', ctrl.adminRegister)
router.post('/admin/login',    ctrl.adminLogin)

// Citizen
router.post('/citizen/register', ctrl.citizenRegister)
router.post('/citizen/login',    ctrl.citizenLogin)

// Get logged-in user (any role)
router.get('/me', auth, ctrl.getMe)

module.exports = router
