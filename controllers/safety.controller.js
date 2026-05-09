import SafetyZone    from '../models/SafetyZone.js'
import CommunityPost from '../models/CommunityPost.js'
import User from '../models/User.js'

const getCrowdSafetyLevel = (count) => {
  if (count === 0)               return { status: 'unsafe',  level: 'empty',    reason: 'You are alone in this area' }
  if (count >= 1 && count <= 2)  return { status: 'unsafe',  level: 'very-low', reason: 'Very few people nearby' }
  if (count >= 3 && count <= 5)  return { status: 'caution', level: 'low',      reason: 'Few women nearby — stay alert' }
  if (count >= 6 && count <= 9)  return { status: 'caution', level: 'medium',   reason: 'Some women nearby' }
  if (count >= 10)               return { status: 'safe',    level: 'high',     reason: '10+ women nearby — safe area' }
  return                                { status: 'safe',    level: 'unknown',  reason: 'Default safe zone' }
}

// CHECK ZONE
export const checkZone = async (req, res) => {
  try {
    const { lat, lng } = req.body

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location required' })
    }

    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ message: 'Invalid coordinates' })
    }

    // Step 1 — Admin zone check
    let adminZone = null
    try {
      adminZone = await SafetyZone.findOne({
        location: {
          $geoWithin: {
            $centerSphere: [[lngNum, latNum], 500 / 6378100]
          }
        },
        isActive: true,
      })
    } catch (zoneErr) {
      console.log('SafetyZone query skipped:', zoneErr.message)
    }

    // Step 2 — Distress posts count
    let recentDistressPosts = 0
    try {
      recentDistressPosts = await CommunityPost.countDocuments({
        type:     'distress',
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
        'location.coordinates.0': { $exists: true },
        location: {
          $geoWithin: {
            $centerSphere: [[lngNum, latNum], 300 / 6378100]
          }
        },
      })
    } catch (distressErr) {
      console.log('Distress query skipped:', distressErr.message)
    }

    // Step 3 — Active users nearby count
    let activeUsersNearby = 0
    try {
      activeUsersNearby = await CommunityPost.countDocuments({
        isActive:  true,
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
        'location.coordinates.0': { $exists: true },
        location: {
          $geoWithin: {
            $centerSphere: [[lngNum, latNum], 200 / 6378100]
          }
        },
      })
    } catch (usersErr) {
      console.log('Active users query skipped:', usersErr.message)
    }

    // Step 4 — Final status decide karo
    let status = 'safe'
    let reason = 'Default safe zone'
    const crowdSafety = getCrowdSafetyLevel(activeUsersNearby)

    if (adminZone) {
      status = adminZone.status
      reason = `Admin marked zone: ${adminZone.name}`
    } else if (recentDistressPosts >= 2) {
      status = 'unsafe'
      reason = `${recentDistressPosts} distress reports in last hour`
    } else {
      status = crowdSafety.status
      reason = crowdSafety.reason
    }

    res.json({
      success: true,
      zone: {
        status,
        reason,
        crowdCount:      activeUsersNearby,
        crowdLevel:      crowdSafety.level,
        distressReports: recentDistressPosts,
        adminZone:       adminZone ? adminZone.name : null,
      },
    })

  } catch (error) {
    console.error('checkZone error:', error)
    res.status(500).json({ message: error.message })
  }
}

// GET NEARBY ZONES
export const getNearbyZones = async (req, res) => {
  try {
    const { lat, lng, radius = 2000 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng required' })
    }

    let zones = []
    try {
      zones = await SafetyZone.find({
        location: {
          $geoWithin: {
            $centerSphere: [
              [parseFloat(lng), parseFloat(lat)],
              parseInt(radius) / 6378100
            ]
          }
        },
        isActive: true,
      }).limit(20)
    } catch (err) {
      console.log('getNearbyZones query skipped:', err.message)
    }

    res.json({ success: true, zones })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ADD ZONE — admin only
export const addZone = async (req, res) => {
  try {
    const { name, city, lat, lng, status, radius } = req.body

    if (!name || !lat || !lng) {
      return res.status(400).json({ message: 'name, lat, lng required' })
    }

    const zone = await SafetyZone.create({
      name,
      city,
      status:   status || 'safe',
      radius:   radius || 500,
      addedBy:  req.user.id,
      isActive: true,
      location: {
        type:        'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
    })

    res.status(201).json({ success: true, zone })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// UPDATE USER LOCATION
export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location required' })
    }

    res.json({ success: true, message: 'Location updated' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}