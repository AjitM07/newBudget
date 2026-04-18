const router = require('express').Router()
const ctrl = require('../controllers/authController')
const auth = require('../middleware/authMiddleware')
const role = require('../middleware/roleMiddleware')

router.post('/register', ctrl.register)
router.post('/verify-otp', ctrl.verifyOTP)
router.post('/login', ctrl.login)
router.post('/citizen-login', ctrl.citizenLogin)
router.get('/me', auth, ctrl.getMe)

router.patch('/approve/:id', auth, role('superadmin'), ctrl.approveAdmin)

module.exports = router;