import mongoose from 'mongoose'

const supportRequestSchema = new mongoose.Schema({
  requester:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  helper:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status:       { type: String, enum: ['pending', 'accepted', 'expired', 'cancelled'], default: 'pending' },
  situation:    { type: String, enum: ['followed', 'cab', 'alone', 'unsafe_area', 'other'], required: true },
  location: {
    // Approximate only — floor to 2 decimal places
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    area: { type: String, default: '' },
  },
  chatRoom:     { type: String, default: null },
  expiresAt:    { type: Date, default: () => new Date(Date.now() + 20 * 60 * 1000) },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('SupportRequest', supportRequestSchema)