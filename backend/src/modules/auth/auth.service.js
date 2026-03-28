import { createHash, randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const signAccessToken = (payload) => {
  const expiresIn = env.JWT_ACCESS_EXPIRES_IN;
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60,
  });
};

export const authService = {
  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isMatch = await argon2.verify(user.passwordHash, password);
    if (!isMatch) {
      throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const payload = {
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const tokenFamily = randomUUID();

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        tokenFamily,
        expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  },

  async refresh(oldRefreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new HttpError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const hashed = hashToken(oldRefreshToken);
    const currentSession = await prisma.refreshSession.findFirst({
      where: {
        tokenHash: hashed,
        userId: decoded.sub,
      },
    });

    if (!currentSession || currentSession.isRevoked || currentSession.expiresAt < new Date()) {
      if (currentSession?.tokenFamily) {
        await prisma.refreshSession.updateMany({
          where: { tokenFamily: currentSession.tokenFamily },
          data: { isRevoked: true },
        });
      }
      throw new HttpError(401, 'Refresh token revoked or expired', 'REFRESH_TOKEN_REVOKED');
    }

    await prisma.refreshSession.update({
      where: { id: currentSession.id },
      data: { isRevoked: true },
    });

    const payload = {
      sub: decoded.sub,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await prisma.refreshSession.create({
      data: {
        userId: decoded.sub,
        tokenHash: hashToken(newRefreshToken),
        tokenFamily: currentSession.tokenFamily,
        expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(refreshToken) {
    const hashed = hashToken(refreshToken);
    await prisma.refreshSession.updateMany({
      where: { tokenHash: hashed },
      data: { isRevoked: true },
    });
  },
};
