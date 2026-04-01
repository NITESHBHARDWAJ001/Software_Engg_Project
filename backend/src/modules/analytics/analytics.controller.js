import { analyticsService } from './analytics.service.js';
import { HttpError } from '../../shared/http/httpError.js';

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
