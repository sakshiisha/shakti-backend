import mongoose from 'mongoose'

const periodLogSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  cycleLength:     { type: Number, default: 28 },
  periodLength:    { type: Number, default: 5  },
  lastPeriodStart: { type: Date },
  nextPeriodDate:  { type: Date },
  currentDay:      { type: Number, default: 1 },
  currentPhase:    { type: String, enum: ['menstrual', 'follicular', 'ovulation', 'luteal'], default: 'follicular' },
  history: [{
    startDate: Date,
    endDate:   Date,
    notes:     String,
  }],
  moodHistory: [{
    mood: { type: String, enum: ['joyful', 'peaceful', 'sad', 'anxious', 'angry', 'tired'] },
    note: String,
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true })

export default mongoose.model('PeriodLog', periodLogSchema)