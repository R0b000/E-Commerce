const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer, corsOrigin) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Allow client to subscribe or trigger ping
    socket.on('ping', () => {
      socket.emit('pong', { time: new Date().toISOString() });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitNotification(notification) {
  if (io) {
    const payload = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: notification.title || 'System Notification',
      message: notification.message || '',
      time: notification.time || 'Just now',
      type: notification.type || 'system',
      read: false,
      timestamp: new Date().toISOString(),
    };
    io.emit('notification:new', payload);
    console.log(`[Socket.IO] Broadcasted notification: ${payload.title}`);
  }
}

module.exports = { initSocket, getIO, emitNotification };
