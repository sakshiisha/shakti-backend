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

// PORT (FIX: define before usage in / route)
const PORT = process.env.PORT || 5000

// CORS options — ek jagah define karo
const corsOptions = {
  origin: [
    'http://localhost:3000',
    process.env.CLIENT_URL || 'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}

const io = new Server(server, {
  cors: corsOptions,
})

// DB connect
connectDB()

// Middleware
app.use(helmet())
app.use(cors(corsOptions))        // same corsOptions use karo
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Socket.io har request mein available ho
app.use((req, res, next) => {
  req.io = io
  next()
})

// All routes
app.use('/api', routes)

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'SHAKTI Server running 🌸',
    status: 'OK',
    port: PORT,
  })
})

// 404 handler — koi route match nahi hua
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  })
})

// Sockets
communitySocket(io)
emergencySocket(io)

// Server start
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})