import mongoose from 'mongoose'

const safetyZoneSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  city:   { type: String, required: true },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  status:      { type: String, enum: ['safe', 'caution', 'unsafe'], default: 'safe' },
  radius:      { type: Number, default: 500 },
  isActive:    { type: Boolean, default: true },
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

safetyZoneSchema.index({ location: '2dsphere' })

export default mongoose.model('SafetyZone', safetyZoneSchema)