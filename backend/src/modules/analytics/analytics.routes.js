import { Router } from 'express';
import {
	triggerScrape,
	getAiReport,
	generateAdCopy,
	getCompetitorsSummary,
	getPricingTrends,
	getSentimentBreakdown,
	getTopInsights,
	getProductsByCategory,
	getCompetitorDetails,
	syncStockContext,
	getManualStockCheck,
} from './analytics.controller.js';
import { authGuard } from '../../shared/middleware/auth.js';
import { tenantGuard } from '../../shared/middleware/tenant.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { requireFeatureAccess } from '../../shared/middleware/featureAccess.js';
import { requireModuleAccess } from '../../shared/middleware/moduleAccess.js';

export const analyticsRouter = Router();

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';

// Absolutely crucial: Protects all analytics endpoints with JWT.
// This prevents unauthenticated users from costing us AI inference limits.
analyticsRouter.use(authGuard, tenantGuard);
analyticsRouter.use(requireFeatureAccess('ANALYTICS_MANAGEMENT'));
analyticsRouter.use(requireModuleAccess('ANALYTICS_MANAGEMENT'));

analyticsRouter.post('/scrape', allowRoles(SUPER_ADMIN, ORG_ADMIN), triggerScrape);
analyticsRouter.post('/report', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), getAiReport);
analyticsRouter.post('/generate-ad', allowRoles(SUPER_ADMIN, ORG_ADMIN), generateAdCopy);
analyticsRouter.post('/stock-context/sync', allowRoles(SUPER_ADMIN, ORG_ADMIN), syncStockContext);
analyticsRouter.get('/stock-context/manual-check', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), getManualStockCheck);

// Dashboard routes
analyticsRouter.get('/dashboard/competitors', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), getCompetitorsSummary);
analyticsRouter.get('/dashboard/competitors/:competitorId', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), getCompetitorDetails);
analyticsRouter.get('/dashboard/pricing-trends', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), getPricingTrends);
analyticsRouter.get('/dashboard/sentiment', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), getSentimentBreakdown);
analyticsRouter.get('/dashboard/insights', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), getTopInsights);
analyticsRouter.get('/dashboard/products', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), getProductsByCategory);
