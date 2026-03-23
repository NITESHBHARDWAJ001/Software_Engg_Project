import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { customerRouter } from './modules/customers/customer.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';
import { financeRouter } from './modules/finance/finance.routes.js';
import { organizationRouter } from './modules/organizations/organization.routes.js';
import { taskRouter } from './modules/tasks/tasks.routes.js';
import { exhibitionsRouter } from './modules/exhibitions/exhibitions.routes.js';
import { subscriptionRouter } from './modules/subscriptions/subscription.routes.js';
import { requestContext } from './shared/middleware/requestContext.js';
import { notFoundHandler } from './shared/middleware/notFound.js';
import { errorHandler } from './shared/middleware/errorHandler.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(pinoHttp({ logger }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/health', healthRouter);
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/finance', financeRouter);
app.use('/api/v1/organizations', organizationRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/exhibitions', exhibitionsRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);

app.use(notFoundHandler);
app.use(errorHandler);
