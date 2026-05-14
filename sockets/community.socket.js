const communitySocket = (io) => {
  io.on('connection', (socket) => {

    // ─── Room join ──────────────────────────────────────────────────────────
    socket.on('join-room', (room) => {
      socket.join(room)
      console.log(`[Socket] ${socket.id} joined room: ${room}`)
    })

    // ─── Chat message ────────────────────────────────────────────────────────
    socket.on('send-message', (msg) => {
      if (!msg?.room || !msg?.text) return

      const payload = {
        room:     msg.room,
        text:     msg.text,
        userName: msg.userName || 'Anonymous',
        time:     msg.time || new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit'
        }),
      }

      // Doosre room members ko bhejo
      socket.to(msg.room).emit('chat-message', payload)
    })

    // ─── Location-based area join ────────────────────────────────────────────
    socket.on('join-area', (area) => {
      socket.join(`area_${area}`)
      console.log(`[Socket] ${socket.id} joined area: ${area}`)
    })

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log('[Socket] User disconnected:', socket.id)
    })
  })
}

export default communitySocket