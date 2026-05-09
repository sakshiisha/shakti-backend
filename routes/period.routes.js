import express from 'express'
import { getPeriodData, updatePeriodData, logMood } from '../controllers/period.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/',          protect, getPeriodData)
router.put('/update',    protect, updatePeriodData)
router.post('/mood',     protect, logMood)

export default router