import CommunityPost from '../models/CommunityPost.js'
import User from '../models/User.js'

const RADIUS = 500 // meters — sirf 500m ke andar

// GET NEARBY POSTS
export const getNearbyPosts = async (req, res) => {
  try {
    const { lat, lng } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location required' })
    }

    let posts = []

    try {
      posts = await CommunityPost.find({
        isActive:  true,
        expiresAt: { $gt: new Date() },
        location: {
          $nearSphere: {
            $geometry: {
              type:        'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            $maxDistance: RADIUS, // ✅ sirf 500m
          },
        },
      })
        .sort({ createdAt: -1 })
        .limit(20)
    } catch (geoErr) {
      // Geo index nahi — fallback with manual filter
      const allPosts = await CommunityPost.find({
        isActive:  true,
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: -1 })
        .limit(100)

      // Manual distance filter
      posts = allPosts.filter((post) => {
        const pLng = post.location?.coordinates?.[0]
        const pLat = post.location?.coordinates?.[1]
        if (!pLat || !pLng) return false
        return getDistanceMeters(
          parseFloat(lat), parseFloat(lng), pLat, pLng
        ) <= RADIUS
      })
    }

    res.json({ success: true, posts })
  } catch (error) {
    console.error('getNearbyPosts error:', error)
    res.status(500).json({ message: error.message })
  }
}

// Distance helper
const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const R    = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// CREATE POST
export const createPost = async (req, res) => {
  try {
    const { text, lat, lng, area, type, isAnonymous = true } = req.body

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Text required' })
    }

    const user = await User.findById(req.user.id)

    const post = await CommunityPost.create({
      user:     req.user.id,
      userName: isAnonymous ? 'Anonymous' : (user?.fullName || 'Anonymous'),
      text:     text.trim(),
      type:     type || 'general',
      location: {
        area:        area || 'Nearby',
        type:        'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
      },
    })

    // ✅ Location-based room mein emit — sirf nearby users ko
    const room = `near_${parseFloat(lat).toFixed(2)}_${parseFloat(lng).toFixed(2)}`
    if (req.io) {
      req.io.to(room).emit('new-community-post', {
        _id:      post._id,
        text:     post.text,
        userName: post.userName,
        type:     post.type,
        helpCount: 0,
        location: {
          area:        post.location.area,
          coordinates: post.location.coordinates,
        },
        createdAt: post.createdAt,
      })
    }

    res.status(201).json({ success: true, post })
  } catch (error) {
    console.error('createPost error:', error)
    res.status(500).json({ message: error.message })
  }
}

// MARK HELPED
export const markHelped = async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { helpedBy: req.user.id },
        $inc:      { helpCount: 1 },
      },
      { new: true }
    )

    if (!post) return res.status(404).json({ message: 'Post not found' })

    if (req.io) {
      req.io.emit('post-helped', {
        postId:    post._id,
        helpCount: post.helpCount,
      })
    }

    res.json({ success: true, helpCount: post.helpCount })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE POST
export const deletePost = async (req, res) => {
  try {
    const post = await CommunityPost.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: false },
      { new: true }
    )

    if (!post) return res.status(404).json({ message: 'Post not found or not authorized' })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// START CHAT
export const startChat = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const chatRoom = `chat_${post._id}`
    await CommunityPost.findByIdAndUpdate(req.params.id, { chatRoom })

    res.json({ success: true, chatRoom })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}