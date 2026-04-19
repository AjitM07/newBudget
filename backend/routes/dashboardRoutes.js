const router = require('express').Router()
const ctrl   = require('../controllers/dashboardController')
const auth   = require('../middleware/authMiddleware')
const role   = require('../middleware/roleMiddleware')

router.get('/sector-needs/:regionId',  auth, ctrl.getSectorNeeds)
router.get('/kpis/:regionId',          auth, ctrl.getKPIs)
router.get('/comparisons',             auth, ctrl.getComparisons)
router.put('/region/:regionId',        auth, role('admin', 'superadmin'), ctrl.updateRegionDataset)

module.exports = router