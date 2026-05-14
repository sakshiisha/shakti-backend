import express from 'express'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/nearby', protect, async (req, res) => {
  const { lat, lng, radius = 2000 } = req.query

  if (!lat || !lng) {
    return res.status(400).json({ message: 'lat and lng required' })
  }

  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="police"](around:${radius},${lat},${lng});
      node["amenity"="pharmacy"](around:${radius},${lat},${lng});
      node["amenity"="clinic"](around:${radius},${lat},${lng});
    );
    out body;
  `

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
    })

    if (!response.ok) throw new Error('Overpass failed')

    const data = await response.json()
    res.json(data)

  } catch (err) {
    console.error('Overpass proxy error:', err)
    res.status(500).json({ message: 'Places fetch failed' })
  }
})

export default router