import express from 'express'
import { getNearbyPosts, createPost, markHelped, deletePost } from '../controllers/community.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/nearby',    protect, getNearbyPosts)
router.post('/create',   protect, createPost)
router.put('/help/:id',  protect, markHelped)
router.delete('/:id',    protect, deletePost)

export default router