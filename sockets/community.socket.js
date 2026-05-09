const communitySocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('join-area', (area) => socket.join(area))
    socket.on('new-post', (data) => io.to(data.area).emit('post-received', data))
    socket.on('disconnect', () => console.log('User disconnected:', socket.id))
  })
}

export default communitySocket