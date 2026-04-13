import { createServer } from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './shared/db/prisma.js';
import { initializeWebSocket } from './shared/websocket/dashboardEvents.js';

const httpServer = createServer(app);
initializeWebSocket(httpServer);

const server = httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Backend API started');
  logger.info({}, 'WebSocket server initialized');
});

const shutdown = async () => {
  logger.info('Shutting down server');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
