import mongoose from 'mongoose'

const tempChatSchema = new mongoose.Schema({
  room:      { type: String, required: true, unique: true },
  request:   { type: mongoose.Schema.Types.ObjectId, ref: 'SupportRequest' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    senderAlias: { type: String }, // 'User A' / 'User B' — no real name
    text:        { type: String },
    time:        { type: Date, default: Date.now },
  }],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 20 * 60 * 1000) },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('TempChat', tempChatSchema)