import { analyticsService } from './analytics.service.js';
import { HttpError } from '../../shared/http/httpError.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { analyticsStockContextSchema } from './analytics.schemas.js';

export const triggerScrape = async (req, res, next) => {
  try {
    const { url } = req.body;
    const orgId = req.auth?.organizationId || req.body.org_id || 'test-org';
    if (!url) throw new HttpError(400, 'url is required in request body');
    const result = await analyticsService.triggerScrape(url, orgId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAiReport = async (req, res, next) => {
  try {
    const orgId = req.auth?.organizationId || req.body.org_id || 'test-org';
    const result = await analyticsService.getAiReport(orgId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const generateAdCopy = async (req, res, next) => {
  try {
    const { domain } = req.body;
    const orgId = req.auth.organizationId;
    if (!domain) throw new HttpError(400, 'domain is required in request body');
    const result = await analyticsService.generateAdCopy(domain, orgId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCompetitorsSummary = async (req, res, next) => {
  try {
    const orgId = req.query.org_id || req.auth?.organizationId || 'test-org';
    const result = await analyticsService.getCompetitorsSummary(orgId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCompetitorDetails = async (req, res, next) => {
  try {
    const { competitorId } = req.params;
    const orgId = req.query.org_id || req.auth?.organizationId || 'test-org';
    const result = await analyticsService.getCompetitorDetails(orgId, competitorId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPricingTrends = async (req, res, next) => {
  try {
    const orgId = req.query.org_id || req.auth?.organizationId || 'test-org';
    const days = parseInt(req.query.days) || 30;
    const result = await analyticsService.getPricingTrends(orgId, days);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getSentimentBreakdown = async (req, res, next) => {
  try {
    const orgId = req.query.org_id || req.auth?.organizationId || 'test-org';
    const result = await analyticsService.getSentimentBreakdown(orgId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTopInsights = async (req, res, next) => {
  try {
    const orgId = req.query.org_id || req.auth?.organizationId || 'test-org';
    const limit = parseInt(req.query.limit) || 5;
    const result = await analyticsService.getTopInsights(orgId, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getProductsByCategory = async (req, res, next) => {
  try {
    const orgId = req.query.org_id || req.auth?.organizationId || 'test-org';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await analyticsService.getProductsByCategory(orgId, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const syncStockContext = async (req, res, next) => {
  try {
    const orgId = req.auth?.organizationId;
    if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

    const payload = analyticsStockContextSchema.parse(req.body || {});
    let items = payload.items;

    if (payload.sourceMode === 'AUTO') {
      items = await inventoryService.listForAnalytics(orgId, payload.limit);
    }

    const result = await analyticsService.ingestStockContext(orgId, payload.sourceMode, items);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getManualStockCheck = async (req, res, next) => {
  try {
    const orgId = req.auth?.organizationId;
    if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

    const result = await analyticsService.getStockContextManualCheck(orgId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
