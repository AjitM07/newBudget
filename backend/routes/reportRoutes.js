const router = require('express').Router()
const ctrl = require('../controllers/reportController')
const auth = require('../middleware/authMiddleware')
const role = require('../middleware/roleMiddleware')

// ── Reports ──────────────────────────────────────────────────────────────────
router.post(
  '/generate',
  auth, role('admin', 'superadmin'),
  ctrl.generateReport
)

router.get(
  '/region/:regionId',
  auth,
  ctrl.getReportsByRegion
)

router.get(
  '/:id',
  auth,
  ctrl.getReportById
)

router.patch(
  '/:id/publish',
  auth, role('admin', 'superadmin'),
  ctrl.publishReport
)

router.delete(
  '/:id',
  auth, role('admin', 'superadmin'),
  ctrl.deleteReport
)

router.post(
  '/:id/email',
  auth, role('admin', 'superadmin'),
  ctrl.emailReport
)

// ── Scenarios ─────────────────────────────────────────────────────────────────
router.post(
  '/scenarios/save',
  auth, role('admin', 'superadmin'),
  ctrl.saveScenario
)

router.get(
  '/scenarios/:regionId',
  auth,
  ctrl.getScenarios
)

// ── Comparison ────────────────────────────────────────────────────────────────
router.post(
  '/compare',
  auth, role('admin', 'superadmin'),
  ctrl.compareAllocations
)

module.exports = router