import CommunityPost from '../models/CommunityPost.js'

export const getNearbyPosts = async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query
    const posts = await CommunityPost.find({
      'location.coordinates': {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 }).limit(10)

    res.json({ success: true, posts })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createPost = async (req, res) => {
  try {
    const { text, lat, lng, area, type } = req.body
    const post = await CommunityPost.create({
      user: req.user.id,
      text,
      type: type || 'general',
      location: {
        area,
        coordinates: { type: 'Point', coordinates: [lng, lat] },
      },
    })

    req.io.emit('new-community-post', {
      id: post._id,
      text: post.text,
      area: post.location.area,
      time: post.createdAt,
      type: post.type,
    })

    res.status(201).json({ success: true, post })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const markHelped = async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { helpedBy: req.user.id }, $inc: { helpCount: 1 } },
      { new: true }
    )
    res.json({ success: true, helpCount: post.helpCount })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deletePost = async (req, res) => {
  try {
    await CommunityPost.findByIdAndUpdate(req.params.id, { isActive: false })
    res.json({ success: true, message: 'Post removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}