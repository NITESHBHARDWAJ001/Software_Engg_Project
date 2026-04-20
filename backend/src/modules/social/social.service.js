const mockReels = [
  {
    id: 'reel-1',
    organizationId: 'cce7b659-e31f-4ae7-86be-a461555ac457',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
    videoUrl: '#',
    caption: '✨ New Collection Alert! Banarasi Silk Sarees that redefine elegance 🎉 #EthnicFashion #SareeLove',
    views: 125000,
    likes: 8450,
    comments: 342,
    shares: 156,
    engagementRate: 7.2,
    postedAt: '2026-02-20T00:00:00.000Z',
    hashtags: ['#EthnicFashion', '#SareeLove', '#BanarasiSilk', '#TraditionalWear'],
  },
  {
    id: 'reel-2',
    organizationId: 'cce7b659-e31f-4ae7-86be-a461555ac457',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e9?w=400',
    videoUrl: '#',
    caption: '🌸 Stunning Lehenga Collection for the Wedding Season! Shop now 💕 #BridalFashion #Lehenga',
    views: 98500,
    likes: 6820,
    comments: 278,
    shares: 124,
    engagementRate: 7.4,
    postedAt: '2026-02-18T00:00:00.000Z',
    hashtags: ['#BridalFashion', '#Lehenga', '#WeddingWear', '#IndianBridal'],
  },
  {
    id: 'reel-3',
    organizationId: 'cce7b659-e31f-4ae7-86be-a461555ac457',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400',
    videoUrl: '#',
    caption: '🎨 How to Style Your Saree in 5 Different Ways! Tutorial 📺 #FashionTips #SareeDraping',
    views: 215000,
    likes: 15600,
    comments: 521,
    shares: 342,
    engagementRate: 8.1,
    postedAt: '2026-02-15T00:00:00.000Z',
    hashtags: ['#FashionTips', '#SareeDraping', '#Tutorial', '#IndianStyle'],
  },
  {
    id: 'reel-4',
    organizationId: 'cce7b659-e31f-4ae7-86be-a461555ac457',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
    videoUrl: '#',
    caption: '💃 Festive Collection Drop! Get ready for the celebrations 🪔 #FestiveWear #Diwali',
    views: 87600,
    likes: 5840,
    comments: 189,
    shares: 98,
    engagementRate: 7.0,
    postedAt: '2026-02-12T00:00:00.000Z',
    hashtags: ['#FestiveWear', '#Diwali', '#IndianFestival', '#TraditionalFashion'],
  },
  {
    id: 'reel-5',
    organizationId: 'cce7b659-e31f-4ae7-86be-a461555ac457',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e9?w=400',
    videoUrl: '#',
    caption: '👗 Behind the Scenes: Making of a Handloom Masterpiece 🧵 #Handloom #SustainableFashion',
    views: 145000,
    likes: 11200,
    comments: 456,
    shares: 267,
    engagementRate: 8.4,
    postedAt: '2026-02-08T00:00:00.000Z',
    hashtags: ['#Handloom', '#SustainableFashion', '#BTS', '#IndianTextiles'],
  },
  {
    id: 'reel-6',
    organizationId: 'cce7b659-e31f-4ae7-86be-a461555ac457',
    platform: 'INSTAGRAM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400',
    videoUrl: '#',
    caption: '⭐ Customer Transformation! See how our sarees make magic happen ✨ #CustomerLove',
    views: 67800,
    likes: 4560,
    comments: 156,
    shares: 78,
    engagementRate: 7.1,
    postedAt: '2026-02-05T00:00:00.000Z',
    hashtags: ['#CustomerLove', '#Transformation', '#SareeStyle', '#HappyCustomers'],
  },
];

const mockComments = [
  {
    id: 'comm-1',
    reelId: 'reel-1',
    author: 'priya_fashion',
    text: 'Absolutely gorgeous! Love the color combination 😍',
    sentiment: 'POSITIVE',
    sentimentScore: 0.92,
    postedAt: '2026-02-20T00:00:00.000Z',
  },
  {
    id: 'comm-2',
    reelId: 'reel-1',
    author: 'saree_lover_123',
    text: 'Beautiful collection! What is the price range?',
    sentiment: 'POSITIVE',
    sentimentScore: 0.78,
    postedAt: '2026-02-20T00:00:00.000Z',
  },
  {
    id: 'comm-3',
    reelId: 'reel-2',
    author: 'bride_to_be_2026',
    text: 'This is exactly what I was looking for! Can I visit your store?',
    sentiment: 'POSITIVE',
    sentimentScore: 0.88,
    postedAt: '2026-02-18T00:00:00.000Z',
  },
  {
    id: 'comm-4',
    reelId: 'reel-3',
    author: 'fashion_critic',
    text: 'Video quality could be better. Content is good though.',
    sentiment: 'NEUTRAL',
    sentimentScore: 0.45,
    postedAt: '2026-02-15T00:00:00.000Z',
  },
  {
    id: 'comm-5',
    reelId: 'reel-3',
    author: 'traditional_wear_fan',
    text: 'Amazing tutorial! Very helpful for beginners 🙏',
    sentiment: 'POSITIVE',
    sentimentScore: 0.95,
    postedAt: '2026-02-15T00:00:00.000Z',
  },
];

const mockCampaigns = [
  {
    id: 'camp-1',
    organizationId: 'cce7b659-e31f-4ae7-86be-a461555ac457',
    name: 'Bridal Collection Launch',
    platform: 'Instagram + Facebook',
    budget: 50000,
    spent: 48500,
    reach: 450000,
    impressions: 1250000,
    clicks: 15600,
    conversions: 342,
    roi: 3.8,
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-02-28T00:00:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'camp-2',
    organizationId: 'cce7b659-e31f-4ae7-86be-a461555ac457',
    name: 'Valentine Special Offer',
    platform: 'Instagram',
    budget: 25000,
    spent: 25000,
    reach: 285000,
    impressions: 680000,
    clicks: 8900,
    conversions: 178,
    roi: 4.2,
    startDate: '2026-02-10T00:00:00.000Z',
    endDate: '2026-02-14T00:00:00.000Z',
    status: 'COMPLETED',
  },
  {
    id: 'camp-3',
    organizationId: 'cce7b659-e31f-4ae7-86be-a461555ac457',
    name: 'Summer Collection Teaser',
    platform: 'Instagram + YouTube',
    budget: 75000,
    spent: 0,
    reach: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    roi: 0,
    startDate: '2026-03-15T00:00:00.000Z',
    endDate: '2026-04-15T00:00:00.000Z',
    status: 'SCHEDULED',
  },
];

const mockSentimentTrend = [
  { date: '2026-01-25', positive: 68, neutral: 24, negative: 8 },
  { date: '2026-01-28', positive: 72, neutral: 21, negative: 7 },
  { date: '2026-02-01', positive: 75, neutral: 18, negative: 7 },
  { date: '2026-02-05', positive: 78, neutral: 17, negative: 5 },
  { date: '2026-02-10', positive: 82, neutral: 14, negative: 4 },
  { date: '2026-02-15', positive: 85, neutral: 12, negative: 3 },
  { date: '2026-02-20', positive: 88, neutral: 10, negative: 2 },
];

const mockCompetitors = [
  {
    id: 'comp-1',
    name: 'FashionHub',
    platform: 'Instagram',
    followers: 250000,
    engagementRate: 4.2,
    topHashtags: ['#Fashion', '#Style', '#Outfit'],
    competitorAnalysis: 'Direct competitor in ethnic wear segment',
  },
  {
    id: 'comp-2',
    name: 'EthnicStyle Co',
    platform: 'Instagram',
    followers: 180000,
    engagementRate: 3.8,
    topHashtags: ['#EthnicFashion', '#Traditional', '#IndianWear'],
    competitorAnalysis: 'Similar product range, slightly lower engagement',
  },
  {
    id: 'comp-3',
    name: 'BridalFashion Pro',
    platform: 'Instagram',
    followers: 320000,
    engagementRate: 5.1,
    topHashtags: ['#Bridal', '#Wedding', '#Lehenga'],
    competitorAnalysis: 'Strong in bridal segment, higher engagement rates',
  },
];

const DEFAULT_MOCK_ORG_ID = 'cce7b659-e31f-4ae7-86be-a461555ac457';

const toScopedRecords = (records, organizationId) =>
  records.map((record) => ({
    ...record,
    organizationId,
  }));

const getScopedReels = (organizationId) => {
  const exact = mockReels.filter((r) => r.organizationId === organizationId);
  if (exact.length > 0) {
    return exact;
  }

  // Mock mode fallback: expose demo reels for any org id used by the UI.
  return toScopedRecords(mockReels, organizationId || DEFAULT_MOCK_ORG_ID);
};

const getScopedCampaigns = (organizationId) => {
  const exact = mockCampaigns.filter((c) => c.organizationId === organizationId);
  if (exact.length > 0) {
    return exact;
  }

  return toScopedRecords(mockCampaigns, organizationId || DEFAULT_MOCK_ORG_ID);
};

export const getAllReels = async (organizationId) => {
  return getScopedReels(organizationId);
};

export const getSentimentAnalysis = async (organizationId) => {
  const reels = getScopedReels(organizationId);
  const comments = mockComments.filter((c) =>
    reels.some((r) => r.id === c.reelId),
  );

  const positive = comments.filter((c) => c.sentiment === 'POSITIVE').length;
  const neutral = comments.filter((c) => c.sentiment === 'NEUTRAL').length;
  const negative = comments.filter((c) => c.sentiment === 'NEGATIVE').length;
  const total = comments.length;
  const avgScore = comments.reduce((sum, c) => sum + c.sentimentScore, 0) / (total || 1);

  return {
    positive,
    neutral,
    negative,
    total,
    positivePercent: total ? (positive / total) * 100 : 0,
    neutralPercent: total ? (neutral / total) * 100 : 0,
    negativePercent: total ? (negative / total) * 100 : 0,
    averageSentimentScore: avgScore,
    recentComments: comments.slice(0, 10),
  };
};

export const getSentimentTrend = async () => mockSentimentTrend;

export const getCompetitors = async (organizationId) => mockCompetitors;

export const getCampaigns = async (organizationId) =>
  getScopedCampaigns(organizationId);

export const getEngagementStats = async (organizationId) => {
  const reels = getScopedReels(organizationId);
  const totalViews = reels.reduce((sum, r) => sum + r.views, 0);
  const totalLikes = reels.reduce((sum, r) => sum + r.likes, 0);
  const totalComments = reels.reduce((sum, r) => sum + r.comments, 0);
  const totalShares = reels.reduce((sum, r) => sum + r.shares, 0);
  const avgEngagementRate = reels.length
    ? reels.reduce((sum, r) => sum + r.engagementRate, 0) / reels.length
    : 0;

  return {
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalReels: reels.length,
    avgEngagementRate,
    topPerformingReel: reels.sort((a, b) => b.engagementRate - a.engagementRate)[0] || null,
  };
};
