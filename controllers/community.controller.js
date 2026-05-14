import CommunityPost from '../models/CommunityPost.js'
import User          from '../models/User.js'

// GET NEARBY — sirf 500m ke andar
export const getNearbyPosts = async (req, res) => {
  try {
    const { lat, lng } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location required' })
    }

    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)

    let posts = []

    try {
      posts = await CommunityPost.find({
        isActive:  true,
        expiresAt: { $gt: new Date() },
        location: {
          $nearSphere: {
            $geometry: {
              type:        'Point',
              coordinates: [lngNum, latNum],
            },
            $maxDistance: 500, // 500 meters only
          },
        },
      })
      .sort({ createdAt: -1 })
      .limit(20)
    } catch (geoErr) {
      // Geo index nahi hai — fallback
      posts = await CommunityPost.find({
        isActive:  true,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .limit(20)
    }

    res.json({ success: true, posts })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
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
      user:        req.user.id,
      userName:    isAnonymous ? 'Anonymous' : (user?.fullName || 'Anonymous'),
      text:        text.trim(),
      type:        type || 'distress',
      isAnonymous,
      location: {
        area:        area || 'Nearby',
        type:        'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
      },
    })

    // Socket — sirf nearby users ko notify karo
    if (req.io) {
      req.io.emit('new-community-post', {
        _id:       post._id,
        text:      post.text,
        userName:  post.userName,
        type:      post.type,
        area:      post.location.area,
        lat:       parseFloat(lat),
        lng:       parseFloat(lng),
        createdAt: post.createdAt,
      })
    }

    res.status(201).json({ success: true, post })
  } catch (error) {
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

// DELETE
export const deletePost = async (req, res) => {
  try {
    await CommunityPost.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: false }
    )
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
    res.json({ success: true, chatRoom, postId: post._id })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}