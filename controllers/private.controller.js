import PrivateIssue from '../models/PrivateIssue.js'

export const submitConcern = async (req, res) => {
  try {
    const { category, urgency, concern, needDoctor, allowCommunity } = req.body
    const issue = await PrivateIssue.create({
      user: req.user.id,
      category, urgency, concern, needDoctor, allowCommunity,
    })
    res.status(201).json({ success: true, issue })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMyConcerns = async (req, res) => {
  try {
    const issues = await PrivateIssue.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-concern')
    res.json({ success: true, issues })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getSingleConcern = async (req, res) => {
  try {
    const issue = await PrivateIssue.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
    if (!issue) return res.status(404).json({ message: 'Concern not found' })
    res.json({ success: true, issue })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAllConcerns = async (req, res) => {
  try {
    const { status, urgency, page = 1 } = req.query
    const filter = {}
    if (status)  filter.status  = status
    if (urgency) filter.urgency = urgency

    const issues = await PrivateIssue.find(filter)
      .sort({ urgency: -1, createdAt: -1 })
      .limit(20)
      .skip((page - 1) * 20)
    res.json({ success: true, issues })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const replyToConcern = async (req, res) => {
  try {
    const { responseText } = req.body
    const issue = await PrivateIssue.findByIdAndUpdate(
      req.params.id,
      {
        status: 'replied',
        response: {
          text: responseText,
          respondedBy: req.user.id,
          respondedAt: new Date(),
        },
      },
      { new: true }
    )
    res.json({ success: true, issue })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}