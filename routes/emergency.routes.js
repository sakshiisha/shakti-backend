import express from 'express'
import {
  triggerSOS,
  resolveAlert,
  getMyAlerts,
  saveFcmToken,
} from '../controllers/emergency.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/sos',             protect, triggerSOS)
router.put('/resolve/:id',      protect, resolveAlert)
router.get('/my-alerts',        protect, getMyAlerts)
router.post('/save-fcm-token',  protect, saveFcmToken)

export default router