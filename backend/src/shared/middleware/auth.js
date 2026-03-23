import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { HttpError } from '../http/httpError.js';

export const authGuard = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing bearer token', 'UNAUTHORIZED');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.auth = {
      userId: decoded.sub,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired token', 'UNAUTHORIZED');
  }
};
