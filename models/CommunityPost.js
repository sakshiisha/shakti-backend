import mongoose from 'mongoose'

const communityPostSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:        { type: String, required: true, maxlength: 500 },
  type:        { type: String, enum: ['general', 'distress'], default: 'general' },
  isAnonymous: { type: Boolean, default: true },
  location: {
    area: { type: String, default: '' },
    coordinates: {
      type:        { type: String, enum: ['Point'] },
      coordinates: [Number],
    },
  },
  helpedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  helpCount: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true })

communityPostSchema.index({ 'location.coordinates': '2dsphere' })

export default mongoose.model('CommunityPost', communityPostSchema)