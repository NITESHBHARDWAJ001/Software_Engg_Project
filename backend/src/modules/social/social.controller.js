import { ok } from '../../shared/http/response.js';
import {
  getAllReels,
  getSentimentAnalysis,
  getSentimentTrend,
  getCampaigns,
  getEngagementStats,
  getCompetitors,
} from './social.service.js';

const getOrgId = (req) => {
  return req.query.org_id || req.query.organizationId || 'org-1';
};

export const getReels = async (req, res) => {
  const orgId = getOrgId(req);
  const reels = await getAllReels(orgId);
  res.json(ok(reels));
};

export const getSocialSentiment = async (req, res) => {
  const orgId = getOrgId(req);
  const sentiment = await getSentimentAnalysis(orgId);
  res.json(ok(sentiment));
};

export const getSocialSentimentTrend = async (req, res) => {
  const orgId = getOrgId(req);
  const trend = await getSentimentTrend(orgId);
  res.json(ok(trend));
};

export const getSocialCampaigns = async (req, res) => {
  const orgId = getOrgId(req);
  const campaigns = await getCampaigns(orgId);
  res.json(ok(campaigns));
};

export const getSocialEngagement = async (req, res) => {
  const orgId = getOrgId(req);
  const engagement = await getEngagementStats(orgId);
  res.json(ok(engagement));
};

export const getSocialCompetitors = async (req, res) => {
  const orgId = getOrgId(req);
  const competitors = await getCompetitors(orgId);
  res.json(ok(competitors));
};
