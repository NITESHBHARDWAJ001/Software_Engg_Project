import { Server } from 'socket.io';
import { logger } from '../../config/logger.js';

let io = null;

export const initializeWebSocket = (expressServer) => {
  io = new Server(expressServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'WebSocket client connected');

    socket.on('subscribe:dashboard', (orgId) => {
      const room = `dashboard:${orgId}`;
      socket.join(room);
      logger.info({ socketId: socket.id, room }, 'Client subscribed to dashboard room');
    });

    socket.on('unsubscribe:dashboard', (orgId) => {
      const room = `dashboard:${orgId}`;
      socket.leave(room);
      logger.info({ socketId: socket.id, room }, 'Client unsubscribed from dashboard room');
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'WebSocket client disconnected');
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initializeWebSocket first.');
  }
  return io;
};

// Emit events to specific organization
export const emitToOrgDashboard = (orgId, eventName, data) => {
  const room = `dashboard:${orgId}`;
  getIO().to(room).emit(eventName, data);
  logger.debug({ room, eventName }, 'Emitted dashboard event');
};

// Broadcast scrape completed event
export const broadcastScrapeComplete = (orgId, scrapeData) => {
  emitToOrgDashboard(orgId, 'scrape:complete', {
    status: 'success',
    timestamp: new Date().toISOString(),
    data: scrapeData,
  });
};

// Broadcast dashboard data update
export const broadcastDashboardUpdate = (orgId, updateType, data) => {
  emitToOrgDashboard(orgId, 'dashboard:update', {
    updateType,
    timestamp: new Date().toISOString(),
    data,
  });
};
