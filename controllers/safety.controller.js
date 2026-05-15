import SafetyZone    from '../models/SafetyZone.js'
import CommunityPost from '../models/CommunityPost.js'

export const checkZone = async (req, res) => {
  try {
    const { lat, lng } = req.body
    if (!lat || !lng) return res.status(400).json({ message: 'Location required' })

    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (isNaN(latNum) || isNaN(lngNum)) return res.status(400).json({ message: 'Invalid coords' })

    // Default — safe
    let status = 'safe'
    let reason = 'Area appears calm'
    let adminZone = null

    // Admin zone check
    try {
      adminZone = await SafetyZone.findOne({
        isActive: true,
        location: {
          $geoWithin: {
            $centerSphere: [[lngNum, latNum], 500 / 6378100],
          },
        },
      })
    } catch {}

    // Distress posts last 1 hour
    let distressCount = 0
    try {
      distressCount = await CommunityPost.countDocuments({
        type:      'distress',
        isActive:  true,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
        location: {
          $geoWithin: {
            $centerSphere: [[lngNum, latNum], 500 / 6378100],
          },
        },
      })
    } catch {}

    if (adminZone) {
      status = adminZone.status
      reason = `Admin zone: ${adminZone.name}`
    } else if (distressCount >= 2) {
      status = 'unsafe'
      reason = `${distressCount} distress reports nearby in last hour`
    } else if (distressCount === 1) {
      status = 'caution'
      reason = '1 distress report nearby — stay alert'
    }

    res.json({
      success: true,
      zone: {
        status,
        reason,
        distressReports: distressCount,
        adminZone: adminZone?.name || null,
      },
    })
  } catch (error) {
    console.error('checkZone error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getNearbyZones = async (req, res) => {
  try {
    const { lat, lng, radius = 2000 } = req.query
    if (!lat || !lng) return res.status(400).json({ message: 'lat lng required' })

    let zones = []
    try {
      zones = await SafetyZone.find({
        isActive: true,
        location: {
          $geoWithin: {
            $centerSphere: [[parseFloat(lng), parseFloat(lat)], parseInt(radius) / 6378100],
          },
        },
      }).limit(20)
    } catch {}

    res.json({ success: true, zones })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const addZone = async (req, res) => {
  try {
    const { name, city, lat, lng, status, radius } = req.body
    if (!name || !lat || !lng) return res.status(400).json({ message: 'name lat lng required' })

    const zone = await SafetyZone.create({
      name, city,
      status:   status || 'safe',
      radius:   radius || 500,
      addedBy:  req.user.id,
      isActive: true,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
    })
    res.status(201).json({ success: true, zone })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateLocation = async (req, res) => {
  res.json({ success: true })
}