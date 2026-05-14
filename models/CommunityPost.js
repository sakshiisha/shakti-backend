import mongoose from 'mongoose'

const communityPostSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:    { type: String, default: 'Anonymous' },
  text:        { type: String, required: true, maxlength: 500 },
  type:        { type: String, enum: ['general', 'distress'], default: 'distress' },
  isAnonymous: { type: Boolean, default: true },

  location: {
    area:        { type: String, default: '' },
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },

  helpedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  helpCount: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },

  // ⏰ AUTO DELETE AFTER TIME
  expiresAt: {
    type:    Date,
    default: () => new Date(Date.now() + 6 * 60 * 60 * 1000),
  },

}, { timestamps: true })

// Geo index for nearby search
communityPostSchema.index({ location: '2dsphere' })

// ⭐ TTL index — Mongo auto delete
communityPostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('CommunityPost', communityPostSchema)