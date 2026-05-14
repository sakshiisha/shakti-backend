import CommunityPost from '../models/CommunityPost.js'

// GET — sab peer stories
export const getPeerStories = async (req, res) => {
  try {
    const posts = await CommunityPost.find({
      isActive:        true,
      type:            'general',
      'location.area': 'Sakhi Community',
      expiresAt:       { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({ success: true, posts })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST — nai story share karo
export const createPeerStory = async (req, res) => {
  try {
    const { text } = req.body

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Text required' })
    }

    const post = await CommunityPost.create({
      user:     req.user.id,
      userName: 'Anonymous Sakhi',
      text:     text.trim(),
      type:     'general',
      location: {
        area:        'Sakhi Community',
        type:        'Point',
        coordinates: [0, 0],
      },
    })

    res.status(201).json({ success: true, post })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}