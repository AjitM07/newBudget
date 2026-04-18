/////// authRoutes.js

const router  = require('express').Router()
const ctrl    = require('../controllers/authController')
const auth    = require('../middleware/authMiddleware')
// const role    = require('../middleware/roleMiddleware')

// ── Public routes (no token needed) ───────────────────────────────────────
router.post('/register',         ctrl.register)
router.post('/verify-otp',       ctrl.verifyOTP)
router.post('/login',            ctrl.login)
router.post('/citizen-login',    ctrl.citizenLogin)

// ── One-time superadmin seed (disable after first use) ────────────────────
// router.post('/create-superadmin', ctrl.createSuperAdmin)

// ── Protected routes ───────────────────────────────────────────────────────
router.get('/me',                auth, ctrl.getMe)

// ── Superadmin only ────────────────────────────────────────────────────────
// router.get('/pending-admins',    auth, role('superadmin'), ctrl.getPendingAdmins)
// router.patch('/approve/:id',     auth, role('superadmin'), ctrl.approveAdmin)
// router.delete('/reject/:id',     auth, role('superadmin'), ctrl.rejectAdmin)

module.exports = router