const communitySocket = (io) => {
  io.on('connection', (socket) => {

    // join nearby room (lat-lng based room)
    socket.on('join-nearby', ({ lat, lng }) => {
      const room = `near_${lat.toFixed(2)}_${lng.toFixed(2)}`
      socket.join(room)
    })

    socket.on('join-room', (room) => {
      socket.join(room)
    })

    socket.on('send-message', (msg) => {
      if (!msg?.room || !msg?.text) return

      socket.to(msg.room).emit('chat-message', {
        room:     msg.room,
        text:     msg.text,
        userName: msg.userName || 'Anonymous',
        time:     new Date().toLocaleTimeString('en-IN',{
          hour:'2-digit', minute:'2-digit'
        }),
      })
    })
  })
}

export default communitySocket