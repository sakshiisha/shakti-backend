const emergencySocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('sos-alert', (data) => {
      io.emit('sos-received', {
        location: data.location,
        area: data.area,
        time: new Date(),
        message: 'A woman needs help nearby!',
      })
    })
  })
}

export default emergencySocket