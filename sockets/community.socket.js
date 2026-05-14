const communitySocket = (io) => {
  io.on('connection', (socket) => {

    // Private chat room join
    socket.on('join-room', (room) => {
      socket.join(room)
    })

    // Chat message — sirf us room mein
    socket.on('send-message', (msg) => {
      if (!msg?.room || !msg?.text) return
      socket.to(msg.room).emit('chat-message', {
        room:     msg.room,
        text:     msg.text,
        userName: msg.userName || 'Anonymous',
        time:     new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit'
        }),
      })
    })

    socket.on('disconnect', () => {})
  })
}

export default communitySocket