import express from 'express'
import {
  requestSupport,
  acceptSupport,
  getNearbyRequests,
  reportUser,
} from '../controllers/support.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/request',         protect, requestSupport)
router.post('/accept/:id',      protect, acceptSupport)
router.get('/nearby',           protect, getNearbyRequests)
router.post('/report',          protect, reportUser)

export default router