import express from 'express'
import {
  logMood,
  getTodayMood,
  getMoodHistory,
  getMoodStats,
} from '../controllers/mood.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/',         protect, logMood)
router.get('/today',     protect, getTodayMood)
router.get('/history',   protect, getMoodHistory)
router.get('/stats',     protect, getMoodStats)

export default router