import TempChat from '../models/TempChat.js'

const mainSocket = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId

    // ── Online presence ──────────────────────────────────────────────────
    socket.on('user_online', ({ lat, lng }) => {
      if (!lat || !lng) return
      const room = `near_${parseFloat(lat).toFixed(1)}_${parseFloat(lng).toFixed(1)}`
      socket.join(room)
      socket.data.room    = room
      socket.data.userId  = userId
    })

    // ── Community post room ──────────────────────────────────────────────
    socket.on('join-nearby', ({ lat, lng }) => {
      if (!lat || !lng) return
      const room = `near_${parseFloat(lat).toFixed(2)}_${parseFloat(lng).toFixed(2)}`
      socket.join(room)
    })

    // ── Private chat room ────────────────────────────────────────────────
    socket.on('join-room', (room) => {
      socket.join(room)
    })

    socket.on('leave-room', (room) => {
      socket.leave(room)
    })

    // ── Chat message ─────────────────────────────────────────────────────
    socket.on('send-message', (msg) => {
      if (!msg?.room || !msg?.text) return
      socket.to(msg.room).emit('chat-message', {
        room:     msg.room,
        text:     msg.text,
        userName: msg.userName || 'Anonymous',
        time:     new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      })
    })

    // ── Support request ───────────────────────────────────────────────────
    socket.on('support_request', (data) => {
      if (!data?.lat || !data?.lng) return
      const room = `near_${parseFloat(data.lat).toFixed(1)}_${parseFloat(data.lng).toFixed(1)}`
      socket.to(room).emit('support_request', {
        requestId: data.requestId,
        situation: data.situation,
        area:      data.area,
      })
    })

    // ── Emergency disconnect ──────────────────────────────────────────────
    socket.on('emergency_disconnect', ({ room }) => {
      if (!room) return
      io.to(room).emit('emergency_disconnect', { reason: 'User ended chat' })
      // Sab users ko room se nikalo
      io.in(room).socketsLeave(room)
    })

    // ── Auto-expire temp chats ────────────────────────────────────────────
    socket.on('join-support-chat', async ({ room }) => {
      if (!room) return
      socket.join(room)

      // Check karo expire hua ya nahi
      try {
        const chat = await TempChat.findOne({ room })
        if (!chat || !chat.isActive || new Date() > chat.expiresAt) {
          socket.emit('chat-expired', { message: 'This chat has expired' })
          return
        }

        // Auto-expire timer
        const remaining = chat.expiresAt - Date.now()
        setTimeout(async () => {
          io.to(room).emit('chat-expired', { message: 'Chat session ended (20 min limit)' })
          await TempChat.findOneAndUpdate({ room }, { isActive: false })
          io.in(room).socketsLeave(room)
        }, remaining)
      } catch {}
    })

    socket.on('disconnect', () => {
      console.log('[Socket] disconnected:', socket.id)
    })
  })
}

export default mainSocket