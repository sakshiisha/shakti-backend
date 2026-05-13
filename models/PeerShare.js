import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  text: String,
  createdAt: { type: Date, default: Date.now }
})

const peerShareSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 500,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: [commentSchema],
}, { timestamps: true })

export default mongoose.model('PeerShare', peerShareSchema)