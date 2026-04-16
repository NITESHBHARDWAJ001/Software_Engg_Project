import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

export enum SentimentType {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
}

export interface SocialReel {
  id: string;
  organizationId: string;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE';
  thumbnailUrl: string;
  videoUrl: string;
  caption: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  postedAt: string;
  hashtags: string[];
}

export interface Comment {
  id: string;
  reelId: string;
  author: string;
  text: string;
  sentiment: SentimentType;
  sentimentScore: number;
  postedAt: string;
}

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SCHEDULED';
}

export interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const request = async <T>(path: string): Promise<T> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
};

export const socialApiService = {
  async getAllReels(organizationId: string): Promise<SocialReel[]> {
    return request<SocialReel[]>(`/v1/social/reels?org_id=${encodeURIComponent(organizationId)}`);
  },

  async getSentimentAnalysis(organizationId: string) {
    return request<{
      positive: number;
      neutral: number;
      negative: number;
      total: number;
      positivePercent: number;
      neutralPercent: number;
      negativePercent: number;
      averageSentimentScore: number;
      recentComments: Comment[];
    }>(`/v1/social/sentiment?org_id=${encodeURIComponent(organizationId)}`);
  },

  async getSentimentTrend(organizationId: string): Promise<SentimentTrend[]> {
    return request<SentimentTrend[]>(`/v1/social/sentiment/trend?org_id=${encodeURIComponent(organizationId)}`);
  },

  async getCampaigns(organizationId: string): Promise<Campaign[]> {
    return request<Campaign[]>(`/v1/social/campaigns?org_id=${encodeURIComponent(organizationId)}`);
  },

  async getEngagementStats(organizationId: string) {
    return request<{
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      totalReels: number;
      avgEngagementRate: number;
      topPerformingReel: SocialReel | null;
    }>(`/v1/social/engagement?org_id=${encodeURIComponent(organizationId)}`);
  },
};
