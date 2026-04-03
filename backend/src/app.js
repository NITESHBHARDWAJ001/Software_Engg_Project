import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { getOpenApiSpec, getOpenApiSpecRaw } from './docs/openapi.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { customerRouter } from './modules/customers/customer.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';
import { financeRouter } from './modules/finance/finance.routes.js';
import { organizationRouter } from './modules/organizations/organization.routes.js';
import { employeeRouter } from './modules/employees/employee.routes.js';
import { taskRouter } from './modules/tasks/tasks.routes.js';
import { exhibitionsRouter } from './modules/exhibitions/exhibitions.routes.js';
import { subscriptionRouter } from './modules/subscriptions/subscription.routes.js';
import { requestContext } from './shared/middleware/requestContext.js';
import { notFoundHandler } from './shared/middleware/notFound.js';
import { errorHandler } from './shared/middleware/errorHandler.js';

export const app = express();
app.set('trust proxy', 1);

const normalizeOrigin = (value) => value.replace(/\/+$/, '');
const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map(normalizeOrigin);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g., server-to-server, curl, health checks).
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedIncomingOrigin = normalizeOrigin(origin);
      const isAllowed = allowedOrigins.includes(normalizedIncomingOrigin);

      callback(null, isAllowed);
    },
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

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/health', healthRouter);
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1', apiLimiter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/finance', financeRouter);
app.use('/api/v1/organizations', organizationRouter);
app.use('/api/v1/employees', employeeRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/exhibitions', exhibitionsRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);

const openApiSpec = getOpenApiSpec();
app.get('/api-docs.json', (_req, res) => {
  res.json(openApiSpec);
});
app.get('/api-docs.yaml', (_req, res) => {
  res.type('application/yaml').send(getOpenApiSpecRaw());
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use(notFoundHandler);
app.use(errorHandler);
