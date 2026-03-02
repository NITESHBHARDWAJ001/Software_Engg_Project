// Mock data service for Social Media & Marketing Analytics
import { generateId } from '../../utils/helpers';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

export interface Competitor {
  id: string;
  name: string;
  followers: number;
  avgEngagementRate: number;
  postsPerWeek: number;
  avgLikes: number;
  avgComments: number;
  topHashtags: string[];
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

const mockReels: SocialReel[] = [
  {
    id: 'reel-1',
    organizationId: 'org-1',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
    videoUrl: '#',
    caption: '✨ New Collection Alert! Banarasi Silk Sarees that redefine elegance 🎉 #EthnicFashion #SareeLove',
    views: 125000,
    likes: 8450,
    comments: 342,
    shares: 156,
    engagementRate: 7.2,
    postedAt: new Date('2026-02-20').toISOString(),
    hashtags: ['#EthnicFashion', '#SareeLove', '#BanarasiSilk', '#TraditionalWear'],
  },
  {
    id: 'reel-2',
    organizationId: 'org-1',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e9?w=400',
    videoUrl: '#',
    caption: '🌸 Stunning Lehenga Collection for the Wedding Season! Shop now 💕 #BridalFashion #Lehenga',
    views: 98500,
    likes: 6820,
    comments: 278,
    shares: 124,
    engagementRate: 7.4,
    postedAt: new Date('2026-02-18').toISOString(),
    hashtags: ['#BridalFashion', '#Lehenga', '#WeddingWear', '#IndianBridal'],
  },
  {
    id: 'reel-3',
    organizationId: 'org-1',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400',
    videoUrl: '#',
    caption: '🎨 How to Style Your Saree in 5 Different Ways! Tutorial 📺 #FashionTips #SareeDraping',
    views: 215000,
    likes: 15600,
    comments: 521,
    shares: 342,
    engagementRate: 8.1,
    postedAt: new Date('2026-02-15').toISOString(),
    hashtags: ['#FashionTips', '#SareeDraping', '#Tutorial', '#IndianStyle'],
  },
  {
    id: 'reel-4',
    organizationId: 'org-1',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
    videoUrl: '#',
    caption: '💃 Festive Collection Drop! Get ready for the celebrations 🪔 #FestiveWear #Diwali',
    views: 87600,
    likes: 5840,
    comments: 189,
    shares: 98,
    engagementRate: 7.0,
    postedAt: new Date('2026-02-12').toISOString(),
    hashtags: ['#FestiveWear', '#Diwali', '#IndianFestival', '#TraditionalFashion'],
  },
  {
    id: 'reel-5',
    organizationId: 'org-1',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e9?w=400',
    videoUrl: '#',
    caption: '👗 Behind the Scenes: Making of a Handloom Masterpiece 🧵 #Handloom #SustainableFashion',
    views: 145000,
    likes: 11200,
    comments: 456,
    shares: 267,
    engagementRate: 8.4,
    postedAt: new Date('2026-02-08').toISOString(),
    hashtags: ['#Handloom', '#SustainableFashion', '#BTS', '#IndianTextiles'],
  },
  {
    id: 'reel-6',
    organizationId: 'org-1',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400',
    videoUrl: '#',
    caption: '⭐ Customer Transformation! See how our sarees make magic happen ✨ #CustomerLove',
    views: 67800,
    likes: 4560,
    comments: 156,
    shares: 78,
    engagementRate: 7.1,
    postedAt: new Date('2026-02-05').toISOString(),
    hashtags: ['#CustomerLove', '#Transformation', '#SareeStyle', '#HappyCustomers'],
  },
];

const mockComments: Comment[] = [
  {
    id: 'comm-1',
    reelId: 'reel-1',
    author: 'priya_fashion',
    text: 'Absolutely gorgeous! Love the color combination 😍',
    sentiment: SentimentType.POSITIVE,
    sentimentScore: 0.92,
    postedAt: new Date('2026-02-20').toISOString(),
  },
  {
    id: 'comm-2',
    reelId: 'reel-1',
    author: 'saree_lover_123',
    text: 'Beautiful collection! What is the price range?',
    sentiment: SentimentType.POSITIVE,
    sentimentScore: 0.78,
    postedAt: new Date('2026-02-20').toISOString(),
  },
  {
    id: 'comm-3',
    reelId: 'reel-2',
    author: 'bride_to_be_2026',
    text: 'This is exactly what I was looking for! Can I visit your store?',
    sentiment: SentimentType.POSITIVE,
    sentimentScore: 0.88,
    postedAt: new Date('2026-02-18').toISOString(),
  },
  {
    id: 'comm-4',
    reelId: 'reel-3',
    author: 'fashion_critic',
    text: 'Video quality could be better. Content is good though.',
    sentiment: SentimentType.NEUTRAL,
    sentimentScore: 0.45,
    postedAt: new Date('2026-02-15').toISOString(),
  },
  {
    id: 'comm-5',
    reelId: 'reel-3',
    author: 'traditional_wear_fan',
    text: 'Amazing tutorial! Very helpful for beginners 🙏',
    sentiment: SentimentType.POSITIVE,
    sentimentScore: 0.95,
    postedAt: new Date('2026-02-15').toISOString(),
  },
];

const mockCompetitors: Competitor[] = [
  {
    id: 'comp-1',
    name: 'Fabindia',
    followers: 1250000,
    avgEngagementRate: 4.2,
    postsPerWeek: 7,
    avgLikes: 52000,
    avgComments: 1200,
    topHashtags: ['#Fabindia', '#EthnicWear', '#Sustainable', '#IndianFashion'],
  },
  {
    id: 'comp-2',
    name: 'Biba',
    followers: 890000,
    avgEngagementRate: 5.8,
    postsPerWeek: 5,
    avgLikes: 48000,
    avgComments: 980,
    topHashtags: ['#Biba', '#FashionForAll', '#IndianWear', '#EthnicStyle'],
  },
  {
    id: 'comp-3',
    name: 'W for Woman',
    followers: 750000,
    avgEngagementRate: 6.1,
    postsPerWeek: 6,
    avgLikes: 42000,
    avgComments: 850,
    topHashtags: ['#WforWoman', '#ContemporaryWear', '#IndianFashion', '#WomenWear'],
  },
  {
    id: 'comp-4',
    name: 'Manyavar',
    followers: 1100000,
    avgEngagementRate: 4.8,
    postsPerWeek: 8,
    avgLikes: 55000,
    avgComments: 1100,
    topHashtags: ['#Manyavar', '#MensEthnic', '#WeddingWear', '#Traditional'],
  },
  {
    id: 'comp-5',
    name: 'Your Brand',
    followers: 125000,
    avgEngagementRate: 7.5,
    postsPerWeek: 4,
    avgLikes: 9400,
    avgComments: 380,
    topHashtags: ['#EthnicFashion', '#SareeLove', '#HandloomSarees', '#TraditionalWear'],
  },
];

const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    organizationId: 'org-1',
    name: 'Bridal Collection Launch',
    platform: 'Instagram + Facebook',
    budget: 50000,
    spent: 48500,
    reach: 450000,
    impressions: 1250000,
    clicks: 15600,
    conversions: 342,
    roi: 3.8,
    startDate: new Date('2026-02-01').toISOString(),
    endDate: new Date('2026-02-28').toISOString(),
    status: 'ACTIVE',
  },
  {
    id: 'camp-2',
    organizationId: 'org-1',
    name: 'Valentine Special Offer',
    platform: 'Instagram',
    budget: 25000,
    spent: 25000,
    reach: 285000,
    impressions: 680000,
    clicks: 8900,
    conversions: 178,
    roi: 4.2,
    startDate: new Date('2026-02-10').toISOString(),
    endDate: new Date('2026-02-14').toISOString(),
    status: 'COMPLETED',
  },
  {
    id: 'camp-3',
    organizationId: 'org-1',
    name: 'Summer Collection Teaser',
    platform: 'Instagram + YouTube',
    budget: 75000,
    spent: 0,
    reach: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    roi: 0,
    startDate: new Date('2026-03-15').toISOString(),
    endDate: new Date('2026-04-15').toISOString(),
    status: 'SCHEDULED',
  },
];

const mockSentimentTrend: SentimentTrend[] = [
  { date: '2026-01-25', positive: 68, neutral: 24, negative: 8 },
  { date: '2026-01-28', positive: 72, neutral: 21, negative: 7 },
  { date: '2026-02-01', positive: 75, neutral: 18, negative: 7 },
  { date: '2026-02-05', positive: 78, neutral: 17, negative: 5 },
  { date: '2026-02-10', positive: 82, neutral: 14, negative: 4 },
  { date: '2026-02-15', positive: 85, neutral: 12, negative: 3 },
  { date: '2026-02-20', positive: 88, neutral: 10, negative: 2 },
];

export const socialMediaService = {
  async getAllReels(organizationId: string): Promise<SocialReel[]> {
    await delay(600);
    return mockReels.filter(r => r.organizationId === organizationId);
  },

  async getReelById(reelId: string): Promise<SocialReel | null> {
    await delay(400);
    return mockReels.find(r => r.id === reelId) || null;
  },

  async getReelComments(reelId: string): Promise<Comment[]> {
    await delay(500);
    return mockComments.filter(c => c.reelId === reelId);
  },

  async getAllComments(organizationId: string): Promise<Comment[]> {
    await delay(600);
    const orgReels = mockReels
      .filter(r => r.organizationId === organizationId)
      .map(r => r.id);
    return mockComments.filter(c => orgReels.includes(c.reelId));
  },

  async getSentimentAnalysis(organizationId: string) {
    await delay(600);
    const comments = await this.getAllComments(organizationId);

    const positive = comments.filter(c => c.sentiment === SentimentType.POSITIVE).length;
    const neutral = comments.filter(c => c.sentiment === SentimentType.NEUTRAL).length;
    const negative = comments.filter(c => c.sentiment === SentimentType.NEGATIVE).length;
    const total = comments.length;

    const avgScore =
      comments.reduce((sum, c) => sum + c.sentimentScore, 0) / total || 0;

    return {
      positive,
      neutral,
      negative,
      total,
      positivePercent: (positive / total) * 100,
      neutralPercent: (neutral / total) * 100,
      negativePercent: (negative / total) * 100,
      averageSentimentScore: avgScore,
      recentComments: comments.slice(0, 10),
    };
  },

  async getSentimentTrend(): Promise<SentimentTrend[]> {
    await delay(500);
    return mockSentimentTrend;
  },

  async getCompetitors(): Promise<Competitor[]> {
    await delay(600);
    return mockCompetitors;
  },

  async getCampaigns(organizationId: string): Promise<Campaign[]> {
    await delay(600);
    return mockCampaigns.filter(c => c.organizationId === organizationId);
  },

  async getEngagementStats(organizationId: string) {
    await delay(600);
    const reels = mockReels.filter(r => r.organizationId === organizationId);

    const totalViews = reels.reduce((sum, r) => sum + r.views, 0);
    const totalLikes = reels.reduce((sum, r) => sum + r.likes, 0);
    const totalComments = reels.reduce((sum, r) => sum + r.comments, 0);
    const totalShares = reels.reduce((sum, r) => sum + r.shares, 0);
    const avgEngagement = reels.reduce((sum, r) => sum + r.engagementRate, 0) / reels.length;

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalReels: reels.length,
      avgEngagementRate: avgEngagement,
      topPerformingReel: reels.sort((a, b) => b.engagementRate - a.engagementRate)[0],
    };
  },
};
