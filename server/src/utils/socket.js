import { Server } from 'socket.io';

let io;

export const init = (server, clientOrigin) => {
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
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io tracking has not been initialized!');
  }
  return io;
};

export const sendNotification = (targetUserId, eventType, data) => {
  if (io) {
    io.to(targetUserId).emit('notification', {
      type: eventType,
      payload: data,
      timestamp: new Date()
    });
  }
};

export default {
  init,
  getIO,
  sendNotification
};