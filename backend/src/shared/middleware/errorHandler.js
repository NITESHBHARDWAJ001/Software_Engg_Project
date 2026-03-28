import { ZodError } from 'zod';
import { HttpError } from '../http/httpError.js';
import { logger } from '../../config/logger.js';

export const errorHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.flatten(),
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  logger.error(
    {
      err: error,
      path: req.originalUrl,
      method: req.method,
      requestId: req.headers['x-request-id'],
    },
    'Unhandled error',
  );

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong',
  });
};
