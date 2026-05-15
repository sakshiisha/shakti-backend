import mongoose from 'mongoose'

const emergencyAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    coordinates: { type: [Number], default: [0, 0] },
    address:     { type: String, default: '' },
    area:        { type: String, default: '' },
  },
  smsStatus:       { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  alertedContacts: [{ name: String, phone: String, status: String }],
  isResolved:      { type: Boolean, default: false },
  resolvedAt:      { type: Date, default: null },
}, { timestamps: true })

export default mongoose.model('EmergencyAlert', emergencyAlertSchema)