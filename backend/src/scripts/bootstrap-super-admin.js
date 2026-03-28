import argon2 from 'argon2';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { prisma } from '../shared/db/prisma.js';

const bootstrap = async () => {
  const existing = await prisma.user.findUnique({ where: { email: env.SUPER_ADMIN_EMAIL } });
  if (existing) {
    logger.info({ email: env.SUPER_ADMIN_EMAIL }, 'Super admin already exists. Skipping bootstrap');
    return;
  }

  const passwordHash = await argon2.hash(env.SUPER_ADMIN_PASSWORD);

  await prisma.user.create({
    data: {
      email: env.SUPER_ADMIN_EMAIL,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  logger.info({ email: env.SUPER_ADMIN_EMAIL }, 'Super admin bootstrap completed');
};

bootstrap()
  .catch((error) => {
    logger.error({ err: error }, 'Super admin bootstrap failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
