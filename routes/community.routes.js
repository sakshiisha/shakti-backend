import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import {
  getNearbyPosts,
  createPost,
  markHelped,
  deletePost,
  startChat,
} from '../controllers/community.controller.js'

const router = express.Router()

router.get('/nearby', protect, getNearbyPosts)
router.post('/create', protect, createPost)
router.put('/help/:id', protect, markHelped)
router.delete('/:id', protect, deletePost)
router.post('/chat/:id', protect, startChat)

export default router