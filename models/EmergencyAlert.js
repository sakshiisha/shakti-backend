import mongoose from 'mongoose'

const emergencyAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    coordinates: [Number],  // [lng, lat]
    address:     { type: String, default: '' },
    area:        { type: String, default: '' },
  },
  smsStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
  alertedContacts: [{
    name:   String,
    phone:  String,
    status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  }],
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
}, { timestamps: true })

export default mongoose.model('EmergencyAlert', emergencyAlertSchema)