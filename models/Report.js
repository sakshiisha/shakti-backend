import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  reporter:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason:     { type: String, enum: ['harassment', 'spam', 'fake', 'other'], required: true },
  details:    { type: String, default: '' },
  chatRoom:   { type: String, default: null },
  status:     { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
}, { timestamps: true })

export default mongoose.model('Report', reportSchema)