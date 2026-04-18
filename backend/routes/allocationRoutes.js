const router = require('express').Router()
const ctrl = require('../controllers/allocationController')
const auth = require('../middleware/authMiddleware')
const role = require('../middleware/roleMiddleware')

router.post('/optimize', auth, role('admin', 'superadmin'), ctrl.optimize)
router.post('/simulate', auth, role('admin', 'superadmin'), ctrl.simulate)
router.post('/save', auth, role('admin', 'superadmin'), ctrl.save)
router.get('/history/:regionId', auth, ctrl.getHistory)

module.exports = router