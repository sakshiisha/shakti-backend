import mongoose from 'mongoose'

const communityPostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: { type: String, default: 'Anonymous' }, // ← name store karo
  text:     { type: String, required: true, maxlength: 500 },
  type:     { type: String, enum: ['general', 'distress'], default: 'general' },

  location: {
    area: { type: String, default: '' },
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },

  helpedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  helpCount: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  expiresAt: {
    type:    Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  },

  // Chat room ke liye
  chatRoom: { type: String, default: null },

}, { timestamps: true })

communityPostSchema.index({ location: '2dsphere' })

export default mongoose.model('CommunityPost', communityPostSchema)