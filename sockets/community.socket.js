const communitySocket = (io) => {
  io.on('connection', (socket) => {

    // Room join karo
    socket.on('join-room', (room) => {
      socket.join(room)
      console.log(`User joined room: ${room}`)
    })

    // Room mein message bhejo
    socket.on('send-message', (msg) => {
      // Room ke saare users ko message bhejo
      socket.to(msg.room).emit('chat-message', msg)
    })

    // Area join karo (community feed ke liye)
    socket.on('join-area', (area) => {
      socket.join(area)
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })
}

export default communitySocket