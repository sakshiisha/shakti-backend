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

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://shakti-5akc.vercel.app',
    'https://shakti-5akc.vercel.app/',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials:  true,
  methods:      ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

const io = new Server(server, { cors: corsOptions })

connectDB()

// CORS — sabse pehle lagao
app.use(cors(corsOptions))

// OPTIONS preflight handle karo
app.options('*', cors(corsOptions))

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  req.io = io
  next()
})

app.use('/api', routes)

app.get('/', (req, res) => {
  res.json({ message: 'SHAKTI Server running 🌸', status: 'OK' })
})

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Server Error' })
})

communitySocket(io)
emergencySocket(io)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})