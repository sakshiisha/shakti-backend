import mongoose from 'mongoose'

const privateIssueSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category:        { type: String, enum: ['menstrual', 'reproductive', 'intimacy', 'mental', 'contraception', 'infections', 'other'], required: true },
  urgency:         { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  concern:         { type: String, required: true },
  needDoctor:      { type: Boolean, default: false },
  allowCommunity:  { type: Boolean, default: false },
  status:          { type: String, enum: ['under-review', 'replied', 'closed'], default: 'under-review' },
  response: {
    text:        { type: String, default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
  },
}, { timestamps: true })

export default mongoose.model('PrivateIssue', privateIssueSchema)