import express    from 'express'
import http       from 'http'
import { Server } from 'socket.io'
import cors       from 'cors'
import helmet     from 'helmet'
import 'dotenv/config'

import connectDB       from './config/db.js'
import routes          from './routes/index.js'
import communitySocket from './sockets/community.socket.js'
import emergencySocket from './sockets/emergency.socket.js'

const app    = express()
const server = http.createServer(app)


// ⭐⭐⭐ PRODUCTION READY CORS (VERCEL FIX)
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL, // production main domain
]

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)

    // allow localhost + env domain
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // ⭐ allow ALL vercel deployments (preview + production)
    if (origin.includes('.vercel.app')) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}

const io = new Server(server, { cors: corsOptions })

connectDB()

// CORS sabse pehle
app.use(cors(corsOptions))

// ⭐ Express 5 preflight fix
app.options(/.*/, cors(corsOptions))

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// socket io available in routes
app.use((req, res, next) => {
  req.io = io
  next()
})

// Routes
app.use('/api', routes)

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'SHAKTI Server running 🌸', status: 'OK' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Server Error' })
})

// sockets
communitySocket(io)
emergencySocket(io)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})