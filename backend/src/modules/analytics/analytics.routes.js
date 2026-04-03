import { Router } from 'express';
import { triggerScrape, getAiReport, generateAdCopy, getCompetitorsSummary, getPricingTrends, getSentimentBreakdown, getTopInsights, getProductsByCategory, getCompetitorDetails } from './analytics.controller.js';
import { authGuard } from '../../shared/middleware/auth.js';

export const analyticsRouter = Router();

// Absolutely crucial: Protects all analytics endpoints with JWT.
// This prevents unauthenticated users from costing us AI inference limits.
// TEMP: Disabled for local dev testing
// analyticsRouter.use(authGuard); 

analyticsRouter.post('/scrape', triggerScrape);
analyticsRouter.post('/report', getAiReport);
analyticsRouter.post('/generate-ad', generateAdCopy);

// Dashboard routes
analyticsRouter.get('/dashboard/competitors', getCompetitorsSummary);
analyticsRouter.get('/dashboard/competitors/:competitorId', getCompetitorDetails);
analyticsRouter.get('/dashboard/pricing-trends', getPricingTrends);
analyticsRouter.get('/dashboard/sentiment', getSentimentBreakdown);
analyticsRouter.get('/dashboard/insights', getTopInsights);
analyticsRouter.get('/dashboard/products', getProductsByCategory);
