import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './shared/db/prisma.js';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Backend API started');
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
