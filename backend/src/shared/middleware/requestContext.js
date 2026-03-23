import { randomUUID } from 'node:crypto';

export const requestContext = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
