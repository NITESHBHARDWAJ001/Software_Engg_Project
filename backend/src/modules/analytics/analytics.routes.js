import { Router } from 'express';
import { triggerScrape, getAiReport, generateAdCopy } from './analytics.controller.js';
import { authGuard } from '../../shared/middleware/auth.js';

export const analyticsRouter = Router();

// Absolutely crucial: Protects all analytics endpoints with JWT.
// This prevents unauthenticated users from costing us AI inference limits.
// TEMP: Disabled for local dev testing
// analyticsRouter.use(authGuard); 

analyticsRouter.post('/scrape', triggerScrape);
analyticsRouter.post('/report', getAiReport);
analyticsRouter.post('/generate-ad', generateAdCopy);
