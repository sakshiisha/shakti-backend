import SupportRequest from '../models/SupportRequest.js'
import TempChat       from '../models/TempChat.js'
import User           from '../models/User.js'
import { sendPush }   from '../config/firebase.admin.js'

// Approximate location — privacy ke liye
const approxLocation = (lat, lng) => ({
  lat: parseFloat(parseFloat(lat).toFixed(2)),
  lng: parseFloat(parseFloat(lng).toFixed(2)),
})

// REQUEST SUPPORT
export const requestSupport = async (req, res) => {
  try {
    const { lat, lng, area, situation } = req.body

    const approx = approxLocation(lat, lng)

    const request = await SupportRequest.create({
      requester: req.user.id,
      situation: situation || 'other',
      location: { ...approx, area: area || 'Nearby' },
    })

    // Socket emit — nearby room mein
    const room = `near_${approx.lat.toFixed(1)}_${approx.lng.toFixed(1)}`
    if (req.io) {
      req.io.to(room).emit('support_request', {
        requestId: request._id,
        situation: request.situation,
        area:      request.location.area,
        // NO exact coords, NO user details
      })
    }

    // Nearby users ko push notification
    const nearbyUsers = await User.find({
      _id:      { $ne: req.user.id },
      fcmToken: { $exists: true, $ne: null },
    }).select('fcmToken').limit(20)

    const tokens = nearbyUsers.map(u => u.fcmToken).filter(Boolean)
    if (tokens.length > 0) {
      const { sendPushToMany } = await import('../config/firebase.admin.js')
      await sendPushToMany({
        tokens,
        title: '🙏 Someone needs support nearby',
        body:  `A woman near you needs help — ${request.situation.replace('_', ' ')}`,
        data:  { requestId: String(request._id), type: 'support_request' },
      })
    }

    res.status(201).json({ success: true, requestId: request._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ACCEPT SUPPORT
export const acceptSupport = async (req, res) => {
  try {
    const request = await SupportRequest.findOne({
      _id:      req.params.id,
      status:   'pending',
      isActive: true,
      expiresAt: { $gt: new Date() },
    })

    if (!request) return res.status(404).json({ message: 'Request not found or expired' })
    if (String(request.requester) === String(req.user.id)) {
      return res.status(400).json({ message: 'Cannot accept your own request' })
    }

    const chatRoom = `support_${request._id}`

    await SupportRequest.findByIdAndUpdate(request._id, {
      helper:   req.user.id,
      status:   'accepted',
      chatRoom,
    })

    // TempChat room banao
    await TempChat.create({
      room:         chatRoom,
      request:      request._id,
      participants: [request.requester, req.user.id],
      expiresAt:    new Date(Date.now() + 20 * 60 * 1000),
    })

    // Requester ko notify karo
    if (req.io) {
      req.io.emit('support_accepted', {
        requestId: request._id,
        chatRoom,
        message:   'Someone nearby accepted your support request',
      })
    }

    // Push notification
    const requester = await User.findById(request.requester).select('fcmToken')
    if (requester?.fcmToken) {
      await sendPush({
        token: requester.fcmToken,
        title: '✅ Support is coming!',
        body:  'A community member nearby accepted your request.',
        data:  { chatRoom, type: 'support_accepted' },
      })
    }

    res.json({ success: true, chatRoom })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET NEARBY REQUESTS — helper ke liye
export const getNearbyRequests = async (req, res) => {
  try {
    const { lat, lng } = req.query
    if (!lat || !lng) return res.status(400).json({ message: 'Location required' })

    const approx = approxLocation(lat, lng)
    const delta  = 0.05 // ~5km approx

    const requests = await SupportRequest.find({
      status:   'pending',
      isActive: true,
      expiresAt: { $gt: new Date() },
      'location.lat': { $gte: approx.lat - delta, $lte: approx.lat + delta },
      'location.lng': { $gte: approx.lng - delta, $lte: approx.lng + delta },
      requester: { $ne: req.user.id },
    })
    .select('situation location.area createdAt expiresAt')
    // NO exact coords returned
    .limit(10)

    res.json({ success: true, requests })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// REPORT USER
export const reportUser = async (req, res) => {
  try {
    const { reportedUserId, reason, details, chatRoom } = req.body
    const Report = (await import('../models/Report.js')).default

    await Report.create({
      reporter: req.user.id,
      reported: reportedUserId,
      reason,
      details:  details || '',
      chatRoom: chatRoom || null,
    })

    // Chat room band karo
    if (chatRoom && req.io) {
      req.io.to(chatRoom).emit('emergency_disconnect', {
        reason: 'User reported — chat ended',
      })
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}