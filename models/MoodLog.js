import mongoose from 'mongoose'

const moodLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mood: {
    type: String,
    enum: ['joyful', 'peaceful', 'sad', 'anxious', 'angry', 'tired'],
    required: true,
  },
  note:     { type: String, default: '' },
  cycleDay: { type: Number },
  phase:    { type: String },
  date:     { type: Date, default: Date.now },
}, { timestamps: true })

export default mongoose.model('MoodLog', moodLogSchema)