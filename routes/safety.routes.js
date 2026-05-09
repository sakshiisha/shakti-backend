import express from 'express'
import { checkZone, getNearbyZones, updateLocation, addZone } from '../controllers/safety.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/check-zone',       protect, checkZone)
router.get('/nearby-zones',      protect, getNearbyZones)
router.post('/update-location',  protect, updateLocation)
router.post('/add-zone',         protect, adminOnly, addZone)

export default router