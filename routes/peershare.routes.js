import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import {
  createPost,
  getAllPosts,
  addComment,
  toggleLike
} from '../controllers/peershare.controller.js'

const router = express.Router()

// Get all posts
router.get('/', protect,  getAllPosts)

// Create anonymous post
router.post('/', protect,  createPost)

// Like / Unlike
router.post('/:postId/like',protect,  toggleLike)

// Comment on post
router.post('/:postId/comment', protect,  addComment)

export default router