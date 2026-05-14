import CommunityPost from '../models/CommunityPost.js'
import User          from '../models/User.js'

// Distance check — kya post user ke radius mein hai?
const isWithinRadius = (postCoords, userLat, userLng, radiusMeters) => {
  const [pLng, pLat] = postCoords
  const R    = 6371000
  const dLat = ((pLat - userLat) * Math.PI) / 180
  const dLng = ((pLng - userLng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLat * Math.PI) / 180) *
    Math.cos((pLat  * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return dist <= radiusMeters
}

// ─── GET NEARBY POSTS ───────────────────────────────────────────────────────
export const getNearbyPosts = async (req, res) => {
  try {
    const { lat, lng, radius = 2000 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng required' })
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
            $maxDistance: parseInt(radius),
          },
        },
      })
        .populate('user', 'fullName')
        .limit(30)
    } catch (geoErr) {
      // Geo index nahi — fallback
      posts = await CommunityPost.find({
        isActive:  true,
        expiresAt: { $gt: new Date() },
      })
        .populate('user', 'fullName')
        .sort({ createdAt: -1 })
        .limit(30)
    }

    res.json({ success: true, posts })
  } catch (error) {
    console.error('getNearbyPosts error:', error)
    res.status(500).json({ message: error.message })
  }
}

// ─── CREATE POST ─────────────────────────────────────────────────────────────
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

    // ✅ FIX: location bhi bhejo — frontend filter kar sake
    if (req.io) {
      req.io.emit('new-community-post', {
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

// ─── MARK HELPED ─────────────────────────────────────────────────────────────
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

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

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

// ─── DELETE POST ─────────────────────────────────────────────────────────────
export const deletePost = async (req, res) => {
  try {
    const post = await CommunityPost.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: false },
      { new: true }
    )

    if (!post) {
      return res.status(404).json({ message: 'Post not found or not authorized' })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─── START CHAT ──────────────────────────────────────────────────────────────
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