import { Router } from 'express';
import {
  getReels,
  getSocialSentiment,
  getSocialSentimentTrend,
  getSocialCampaigns,
  getSocialEngagement,
  getSocialCompetitors,
} from './social.controller.js';

export const socialRouter = Router();

socialRouter.get('/reels', getReels);
socialRouter.get('/sentiment', getSocialSentiment);
socialRouter.get('/sentiment/trend', getSocialSentimentTrend);
socialRouter.get('/campaigns', getSocialCampaigns);
socialRouter.get('/engagement', getSocialEngagement);
socialRouter.get('/competitors', getSocialCompetitors);
