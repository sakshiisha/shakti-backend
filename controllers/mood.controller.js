import MoodLog  from '../models/MoodLog.js'
import PeriodLog from '../models/PeriodLog.js'

// LOG MOOD
export const logMood = async (req, res) => {
  try {
    const { mood, note } = req.body

    if (!mood) {
      return res.status(400).json({ message: 'Mood is required' })
    }

    // Period data se current day aur phase lo
    const periodData = await PeriodLog.findOne({ user: req.user.id })
    const cycleDay   = periodData?.currentDay  || null
    const phase      = periodData?.currentPhase || null

    const moodLog = await MoodLog.create({
      user: req.user.id,
      mood,
      note,
      cycleDay,
      phase,
      date: new Date(),
    })

    res.status(201).json({ success: true, moodLog })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET TODAY'S MOOD
export const getTodayMood = async (req, res) => {
  try {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const todayMood = await MoodLog.findOne({
      user: req.user.id,
      date: { $gte: startOfDay },
    }).sort({ date: -1 })

    res.json({ success: true, todayMood })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET MOOD HISTORY — last 30 days
export const getMoodHistory = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const history = await MoodLog.find({
      user: req.user.id,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 })

    res.json({ success: true, history })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET MOOD STATS — kitni baar kaunsa mood aaya
export const getMoodStats = async (req, res) => {
  try {
    const stats = await MoodLog.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    res.json({ success: true, stats })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}