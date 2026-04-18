const router = require('express').Router()
const ctrl = require('../controllers/dashboardController')
const auth = require('../middleware/authMiddleware')

router.get('/sector-needs/:regionId', auth, ctrl.getSectorNeeds)
router.get('/kpis/:regionId', auth, ctrl.getKPIs)
router.get('/comparisons/:regionId', auth, ctrl.getComparisons)

module.exports = router