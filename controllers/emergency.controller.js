import EmergencyAlert from '../models/EmergencyAlert.js'
import User           from '../models/User.js'
import { sendPush }   from '../config/firebase.admin.js'
import twilio         from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export const triggerSOS = async (req, res) => {
  try {
    const { lat, lng, address, area } = req.body
    const user = await User.findById(req.user.id)

    // ✅ Socket PEHLE emit karo — DB se pehle
    if (req.io) {
      req.io.emit('sos_alert', {
        userName: user.fullName,
        area:     area || 'Nearby',
        location: {
          lat: parseFloat(lat).toFixed(2), // approximate
          lng: parseFloat(lng).toFixed(2),
        },
        time:    new Date(),
        message: 'A woman needs help nearby!',
      })
    }

    // DB mein save karo
    const alert = await EmergencyAlert.create({
      user: req.user.id,
      location: {
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
        address: address || '',
        area:    area    || '',
      },
    })

    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`
    const smsMsg   = `🚨 SHAKTI EMERGENCY ALERT!\n\n${user.fullName} needs help!\n📍 ${area || address || 'Unknown'}\n🗺 ${mapsLink}\n\nPlease respond immediately.`

    const contacts = []

    // SMS bhejo
    if (user.emergencyContact?.phone) {
      try {
        await twilioClient.messages.create({
          body: smsMsg,
          from: process.env.TWILIO_PHONE,
          to:   user.emergencyContact.phone,
        })
        contacts.push({ name: user.emergencyContact.name || 'Contact', phone: user.emergencyContact.phone, status: 'sent' })
      } catch {
        contacts.push({ name: user.emergencyContact.name || 'Contact', phone: user.emergencyContact.phone, status: 'failed' })
      }
    }

    // Firebase push — user ke apne phone pe bhi
    if (user.fcmToken) {
      await sendPush({
        token: user.fcmToken,
        title: '🆘 SOS Sent!',
        body:  'Your emergency alert has been sent. Help is coming.',
        data:  { alertId: String(alert._id), type: 'sos_confirmed' },
      })
    }

    await EmergencyAlert.findByIdAndUpdate(alert._id, {
      smsStatus:       contacts.length > 0 ? 'sent' : 'failed',
      alertedContacts: contacts,
    })

    res.status(201).json({ success: true, alertId: alert._id })
  } catch (error) {
    console.error('SOS error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const resolveAlert = async (req, res) => {
  try {
    const alert = await EmergencyAlert.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isResolved: true, resolvedAt: new Date() },
      { new: true }
    )
    if (!alert) return res.status(404).json({ message: 'Alert not found' })
    if (req.io) req.io.emit('sos_resolved', { alertId: alert._id })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMyAlerts = async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find({ user: req.user.id })
      .sort({ createdAt: -1 }).limit(10)
    res.json({ success: true, alerts })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ message: 'Token required' })
    await User.findByIdAndUpdate(req.user.id, { fcmToken: token })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}