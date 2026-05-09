import EmergencyAlert from '../models/EmergencyAlert.js'
import User           from '../models/User.js'
import twilio         from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// TRIGGER SOS
export const triggerSOS = async (req, res) => {
  try {
    const { lat, lng, address, area } = req.body

    // User ka data lo with emergency contact
    const user = await User.findById(req.user.id)

    // Alert create karo
    const alert = await EmergencyAlert.create({
      user: req.user.id,
      location: {
        coordinates: [lng, lat],
        address: address || '',
        area: area || '',
      },
    })

    // Google Maps link banao
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`

    // SMS message
    const smsMessage = `🚨 EMERGENCY ALERT from SHAKTI App!

${user.fullName} needs help urgently!

📍 Location: ${address || area || 'Unknown area'}
🗺️ Live Location: ${mapsLink}

This is an automated SOS alert. Please respond immediately.`

    // Emergency contact ko SMS bhejo
    const contacts = []

    if (user.emergencyContact?.phone) {
      try {
        await twilioClient.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE,
          to: user.emergencyContact.phone,
        })
        contacts.push({
          name:   user.emergencyContact.name || 'Emergency Contact',
          phone:  user.emergencyContact.phone,
          status: 'sent',
        })
      } catch (smsError) {
        contacts.push({
          name:   user.emergencyContact.name || 'Emergency Contact',
          phone:  user.emergencyContact.phone,
          status: 'failed',
        })
      }
    }

    // Alert update karo with SMS status
    await EmergencyAlert.findByIdAndUpdate(alert._id, {
      smsStatus:       contacts.length > 0 ? 'sent' : 'failed',
      alertedContacts: contacts,
    })

    // Socket.io se nearby users ko notify karo
    req.io.emit('sos-alert', {
      area,
      location: { lat, lng },
      time:     new Date(),
      message:  'A woman needs help nearby!',
    })

    res.status(201).json({
      success: true,
      alert: {
        id:              alert._id,
        smsStatus:       contacts.length > 0 ? 'sent' : 'failed',
        alertedContacts: contacts,
        location:        { lat, lng, address },
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// RESOLVE ALERT — user safe hai ab
export const resolveAlert = async (req, res) => {
  try {
    const alert = await EmergencyAlert.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isResolved: true, resolvedAt: new Date() },
      { new: true }
    )

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' })
    }

    // Socket pe resolved broadcast karo
    req.io.emit('sos-resolved', { alertId: alert._id })

    res.json({ success: true, alert })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET MY ALERTS — history
export const getMyAlerts = async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({ success: true, alerts })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}