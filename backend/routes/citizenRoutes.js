const router = require('express').Router()
const ctrl = require('../controllers/citizenController')

router.get('/region/:regionId', ctrl.getPublicRegionData)

module.exports = router