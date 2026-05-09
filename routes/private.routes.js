import express from 'express'
import {
  submitConcern,
  getMyConcerns,
  getSingleConcern,
  getAllConcerns,
  replyToConcern,
} from '../controllers/private.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/submit',       protect, submitConcern)
router.get('/mine',          protect, getMyConcerns)
router.get('/mine/:id',      protect, getSingleConcern)
router.get('/all',           protect, adminOnly, getAllConcerns)
router.put('/reply/:id',     protect, adminOnly, replyToConcern)

export default router