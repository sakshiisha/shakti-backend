import PeriodLog from '../models/PeriodLog.js'

const getPhase = (day) => {
  if (day <= 5)  return 'menstrual'
  if (day <= 13) return 'follicular'
  if (day <= 16) return 'ovulation'
  return 'luteal'
}

export const getPeriodData = async (req, res) => {
  try {
    let data = await PeriodLog.findOne({ user: req.user.id })
    if (!data) data = await PeriodLog.create({ user: req.user.id })
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updatePeriodData = async (req, res) => {
  try {
    const { cycleLength, periodLength, lastPeriodStart } = req.body

    const nextPeriodDate = lastPeriodStart
      ? new Date(new Date(lastPeriodStart).getTime() + cycleLength * 24 * 60 * 60 * 1000)
      : null

    const currentDay = lastPeriodStart
      ? Math.floor((Date.now() - new Date(lastPeriodStart)) / (24 * 60 * 60 * 1000)) + 1
      : 1

    const data = await PeriodLog.findOneAndUpdate(
      { user: req.user.id },
      {
        cycleLength, periodLength, lastPeriodStart,
        nextPeriodDate, currentDay,
        currentPhase: getPhase(currentDay),
        $push: { history: { startDate: lastPeriodStart } },
      },
      { new: true, upsert: true }
    )
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const logMood = async (req, res) => {
  try {
    const { mood, note } = req.body
    const data = await PeriodLog.findOneAndUpdate(
      { user: req.user.id },
      { $push: { moodHistory: { mood, note, date: new Date() } } },
      { new: true, upsert: true }
    )
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}