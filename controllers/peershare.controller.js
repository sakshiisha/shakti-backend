import PeerShare from '../models/PeerShare.js'

export const getAllPosts = async (req, res) => {
  try {
    const posts = await PeerShare.find().sort({ createdAt: -1 })
    res.json(posts)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts' })
  }
}

export const createPost = async (req, res) => {
  try {
    const post = await PeerShare.create({
      text: req.body.text
    })
    res.status(201).json(post)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post' })
  }
}

export const toggleLike = async (req, res) => {
  try {
    const post = await PeerShare.findById(req.params.postId)
    post.likes += 1
    await post.save()
    res.json(post)
  } catch {
    res.status(500).json({ message: 'Failed to like post' })
  }
}

export const addComment = async (req, res) => {
  try {
    const post = await PeerShare.findById(req.params.postId)
    post.comments.push({ text: req.body.text })
    await post.save()
    res.json(post)
  } catch {
    res.status(500).json({ message: 'Failed to comment' })
  }
}