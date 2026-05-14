import express         from 'express'
import authRoutes      from './auth.routes.js'
import safetyRoutes    from './safety.routes.js'
import communityRoutes from './community.routes.js'
import periodRoutes    from './period.routes.js'
import moodRoutes      from './mood.routes.js'
import privateRoutes   from './private.routes.js'
import emergencyRoutes from './emergency.routes.js'
import peerRoutes      from './peer.routes.js'
import placesRoutes    from './places.route.js'

const router = express.Router()

router.use('/auth',      authRoutes)
router.use('/safety',    safetyRoutes)
router.use('/community', communityRoutes)
router.use('/period',    periodRoutes)
router.use('/mood',      moodRoutes)
router.use('/private',   privateRoutes)
router.use('/emergency', emergencyRoutes)
router.use('/peer',      peerRoutes)     // ✅ /peershare → /peer
router.use('/places',    placesRoutes)   // ✅ './' → '/'

export default router