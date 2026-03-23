import { HttpError } from '../http/httpError.js';

export const allowRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.auth) {
      throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
    }
    if (!roles.includes(req.auth.role)) {
      throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
    }
    next();
  };
};
