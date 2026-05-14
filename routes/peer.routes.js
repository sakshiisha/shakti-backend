import express from 'express'
import { getPeerStories, createPeerStory } from '../controllers/peer.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/',  protect, getPeerStories)
router.post('/', protect, createPeerStory)

export default router