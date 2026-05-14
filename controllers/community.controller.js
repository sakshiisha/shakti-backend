import CommunityPost from '../models/CommunityPost.js'
import User from '../models/User.js'

const RADIUS = 500 // meters

// 🟢 GET NEARBY POSTS
export const getNearbyPosts = async (req, res) => {
  try {
    const { lat, lng } = req.query
    if (!lat || !lng)
      return res.status(400).json({ message:'Location required' })

    const posts = await CommunityPost.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
      location: {
        $nearSphere: {
          $geometry: {
            type:'Point',
            coordinates:[parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: RADIUS,
        },
      },
    })
    .sort({ createdAt:-1 })
    .limit(20)

    res.json({ success:true, posts })
  } catch (err) {
    res.status(500).json({ message:err.message })
  }
}

// 🟢 CREATE POST
export const createPost = async (req, res) => {
  try {
    const { text, lat, lng, area, type, isAnonymous=true, expiresInHours=6 } = req.body
    if (!text?.trim())
      return res.status(400).json({ message:'Text required' })

    const user = await User.findById(req.user.id)

    const post = await CommunityPost.create({
      user:req.user.id,
      userName:isAnonymous ? 'Anonymous' : user?.fullName,
      text:text.trim(),
      type,
      isAnonymous,
      expiresAt:new Date(Date.now() + expiresInHours*60*60*1000),
      location:{
        area:area || 'Nearby',
        type:'Point',
        coordinates:[parseFloat(lng), parseFloat(lat)],
      },
    })

    // 🔥 Notify nearby users only
    const room = `near_${lat.toFixed(2)}_${lng.toFixed(2)}`
    req.io.to(room).emit('new-community-post', post)

    res.status(201).json({ success:true, post })
  } catch (err) {
    res.status(500).json({ message:err.message })
  }
}

// 🟢 HELP BUTTON
export const markHelped = async (req,res)=>{
  const post = await CommunityPost.findByIdAndUpdate(
    req.params.id,
    { $addToSet:{ helpedBy:req.user.id }, $inc:{ helpCount:1 } },
    { new:true }
  )

  req.io.emit('post-helped',{ postId:post._id, helpCount:post.helpCount })
  res.json({ success:true })
}

// 🟢 DELETE POST
export const deletePost = async (req,res)=>{
  await CommunityPost.findOneAndUpdate(
    { _id:req.params.id, user:req.user.id },
    { isActive:false }
  )
  res.json({ success:true })
}

// 🟢 START CHAT ROOM
export const startChat = async (req,res)=>{
  const chatRoom = `chat_${req.params.id}`
  res.json({ success:true, chatRoom })
}