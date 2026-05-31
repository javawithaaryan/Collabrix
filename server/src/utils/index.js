const { Server } = require('socket.io');

let io;

module.exports = {
  init: (server, clientOrigin) => {
    io = new Server(server, {
      cors: {
        origin: clientOrigin || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      socket.on('joinUserRoom', (userId) => {
        socket.join(userId);
      });

      socket.on('disconnect', () => {});
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io tracking has not been initialized!');
    }
    return io;
  },
  sendNotification: (targetUserId, eventType, data) => {
    if (io) {
      io.to(targetUserId).emit('notification', {
        type: eventType,
        payload: data,
        timestamp: new Date()
      });
    }
  }
};