import React, { useEffect, useState } from 'react';
import {
  FiPlay,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiTrendingUp,
  FiUsers,
  FiSmile,
  FiMeh,
  FiFrown,
  FiTarget,
  FiActivity,
  FiAlertCircle,
} from 'react-icons/fi';
import {
  socialApiService,
  SocialReel,
  Comment,
  Campaign,
  SentimentType,
} from '../../../services/api/socialApiService';
import { analyticsService } from '../../../services/api/analyticsService';
import { useOrganizationStore } from '../../../store/organizationStore';
import { formatCurrency, formatDate, getRelativeTime } from '../../../utils/helpers';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const SENTIMENT_COLORS = {
  [SentimentType.POSITIVE]: '#06A77D',
  [SentimentType.NEUTRAL]: '#F59E0B',
  [SentimentType.NEGATIVE]: '#E63946',
};

const AnalyticsPage: React.FC = () => {
  const { currentOrganization } = useOrganizationStore();
  const [reels, setReels] = useState<SocialReel[]>([]);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [sentimentTrend, setSentimentTrend] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [engagementStats, setEngagementStats] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([
    { id: 1, name: 'BohoBoutique', url: 'https://bohoboutique.com', product_count: 120, avg_price: 45.5, last_scraped: new Date().toISOString() },
    { id: 2, name: 'EthnicElegance', url: 'https://ethnicelegance.com', product_count: 98, avg_price: 58.2, last_scraped: new Date().toISOString() },
    { id: 3, name: 'TraditionThreads', url: 'https://traditionthreads.com', product_count: 76, avg_price: 39.99, last_scraped: new Date().toISOString() },
  ]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'reels' | 'sentiment' | 'competitors' | 'campaigns'>(
    'reels'
  );
  
  // Real AI States
  const [aiReport, setAiReport] = useState<any>(null);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [reelUrlInput, setReelUrlInput] = useState('');
  const [reelCommentsInput, setReelCommentsInput] = useState('');
  const [isAnalyzingReel, setIsAnalyzingReel] = useState(false);
  const [reelSentimentResult, setReelSentimentResult] = useState<any>(null);

  useEffect(() => {
    loadAllData();
  }, [currentOrganization?.id]);

  const loadAllData = async () => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    const organizationId = currentOrganization?.id ?? 'org-1';
    setLoading(true);
    try {
      const [
        reelsData,
        sentimentAnalysis,
        sentimentTrendData,
        campaignsData,
        engagementData,
        aiReportData,
        competitorsData,
      ] = await Promise.all([
        socialApiService.getAllReels(organizationId),
        socialApiService.getSentimentAnalysis(organizationId),
        socialApiService.getSentimentTrend(organizationId),
        socialApiService.getCampaigns(organizationId),
        socialApiService.getEngagementStats(organizationId),
        analyticsService.getAiReport(organizationId).catch(() => null),
        analyticsService.getCompetitorsSummary(organizationId).catch(() => null),
      ]);

      setReels(reelsData);
      setSentimentData(sentimentAnalysis);
      setSentimentTrend(sentimentTrendData);
      setCampaigns(campaignsData);
      setEngagementStats(engagementData);
      if (aiReportData) setAiReport(aiReportData);
      if (competitorsData?.data) setCompetitors(Array.isArray(competitorsData.data) ? competitorsData.data : []);
    } catch (error) {
      console.error('Failed to load social media data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl) return;
    setIsScraping(true);
    try {
      const organizationId = currentOrganization?.id ?? 'org-1';
      await analyticsService.triggerScrape(scrapeUrl);
      const report = await analyticsService.getAiReport(organizationId);
      setAiReport(report);
      setScrapeUrl('');
    } catch (e) {
      console.error('[handleScrape] Error:', e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      alert(`Failed to scrape competitor: ${errorMsg}`);
    } finally {
      setIsScraping(false);
    }
  };

  const handleAnalyzeReelSentiment = async () => {
    if (!reelUrlInput.trim()) return;

    setIsAnalyzingReel(true);
    try {
      const organizationId = currentOrganization?.id ?? 'org-1';
      const comments = reelCommentsInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const result = await analyticsService.analyzeReelSentiment(
        reelUrlInput.trim(),
        comments,
        organizationId
      );
      setReelSentimentResult(result?.data || null);
    } catch (e) {
      console.error('[handleAnalyzeReelSentiment] Error:', e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      alert(`Failed to analyze reel sentiment: ${errorMsg}`);
    } finally {
      setIsAnalyzingReel(false);
    }
  };

  const getSentimentIcon = (sentiment: SentimentType) => {
    switch (sentiment) {
      case SentimentType.POSITIVE:
        return FiSmile;
      case SentimentType.NEUTRAL:
        return FiMeh;
      case SentimentType.NEGATIVE:
        return FiFrown;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const topReel = reels.reduce<SocialReel | null>((best, reel) => {
    if (!best) return reel;
    return reel.engagementRate > best.engagementRate ? reel : best;
  }, null);

  const weakSentiment = sentimentData
    ? sentimentData.negativePercent > 20
      ? 'negative'
      : sentimentData.neutralPercent > 45
      ? 'neutral'
      : null
    : null;

  const actionableInsights = [
    topReel
      ? {
          title: 'Scale winning content',
          description: `Top reel engagement is ${topReel.engagementRate.toFixed(1)}%. Repurpose this format across next 3 posts.`,
          priority: 'HIGH',
        }
      : null,
    sentimentData
      ? {
          title: 'Sentiment watch',
          description:
            weakSentiment === 'negative'
              ? `Negative sentiment is ${sentimentData.negativePercent.toFixed(1)}%. Respond to top concerns within 24h.`
              : weakSentiment === 'neutral'
              ? `Neutral sentiment is ${sentimentData.neutralPercent.toFixed(1)}%. Add clearer offers and stronger CTAs.`
              : `Positive sentiment is healthy at ${sentimentData.positivePercent.toFixed(1)}%. Keep current messaging style.`,
          priority: weakSentiment ? 'MEDIUM' : 'LOW',
        }
      : null,
    campaigns.length > 0
      ? {
          title: 'Campaign conversion focus',
          description: `Active campaigns: ${campaigns.length}. Move budget to campaigns with strongest comment/share ratio.`,
          priority: 'MEDIUM',
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; description: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }>;

  const aiReportPayload =
    aiReport?.report_data ??
    aiReport?.data?.report_data ??
    aiReport?.data ??
    aiReport ??
    null;
  const aiExecutiveSummary =
    aiReportPayload?.ai_executive_summary ??
    aiReportPayload?.executive_summary ??
    aiReport?.ai_executive_summary ??
    aiReport?.executive_summary ??
    null;
  const aiAnalysisInsights = Array.isArray(aiReportPayload?.analysis?.insights)
    ? aiReportPayload.analysis.insights
    : Array.isArray(aiReport?.analysis?.insights)
    ? aiReport.analysis.insights
    : [];

  const collectInsights = (pattern: RegExp, fallbacks: string[]) => {
    const matches = aiAnalysisInsights.filter((insight: string) => pattern.test(insight));
    return matches.length > 0 ? matches : fallbacks;
  };

  const marketPositioningInsights = collectInsights(
    /position|segment|audience|premium|value|brand|market/i,
    [
      aiExecutiveSummary || 'Generate a competitor report to identify their current market positioning.',
      'Compare how this competitor positions itself on premium vs value messaging.',
    ],
  );

  const pricingSignals = collectInsights(
    /price|pricing|discount|bundle|margin|premium|value/i,
    [
      'Track whether competitor pricing signals premium, discount-led, or bundle-driven strategy.',
      'Use pricing changes to spot aggressive promotion windows or weak value communication.',
    ],
  );

  const contentStrategySignals = collectInsights(
    /reel|content|creative|campaign|engagement|social|influencer|caption/i,
    [
      'Identify whether the competitor is pushing reels, catalog drops, or influencer-led content.',
      'Review which content formats appear to be driving their strongest audience attention.',
    ],
  );

  const riskSignals = collectInsights(
    /risk|weak|negative|gap|issue|pressure|sensitivity|drop/i,
    [
      'Watch for weak pricing clarity, low-value messaging, or sentiment pressure in customer response.',
      'Use this view to detect gaps before they become campaign performance problems.',
    ],
  );

  const recommendedActions = collectInsights(
    /recommend|shift|focus|move|target|promote|test|respond|repurpose/i,
    [
      'Promote categories where your brand can differentiate on value, styling, or availability.',
      'Test stronger hooks, clearer offers, and faster response to visible customer objections.',
    ],
  );

  const generateCompetitorInsights = (comp: any) => {
    const insights = [];
    if (comp.product_count > 100) {
      insights.push(`Wide catalog with ${comp.product_count} products signals premium variety strategy.`);
    } else if (comp.product_count > 50) {
      insights.push(`Focused catalog of ${comp.product_count} products suggests curated positioning.`);
    }
    if (comp.avg_price > 60) {
      insights.push('Premium pricing model — focus on value messaging and brand heritage.');
    } else if (comp.avg_price < 40) {
      insights.push('Budget-friendly positioning — differentiate on unique designs or exclusivity.');
    } else {
      insights.push('Mid-market positioning — opportunity for niche category domination.');
    }
    if (comp.last_scraped) {
      insights.push(`Last analyzed: ${new Date(comp.last_scraped).toLocaleDateString()}`);
    }
    return insights;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Media & Marketing</h1>
          <p className="text-gray-600 mt-1">
            Track social media performance and marketing campaigns
          </p>
        </div>
        {/* <Button variant="primary">
          <FiPlay className="w-4 h-4 mr-2" />
          Create Post
        </Button> */}
      </div>

      {/* Overview Stats */}
      {engagementStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(engagementStats.totalViews)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FiEye className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Likes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(engagementStats.totalLikes)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
                  <FiHeart className="w-6 h-6 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(engagementStats.totalComments)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                  <FiMessageCircle className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shares</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(engagementStats.totalShares)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <FiShare2 className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Engagement</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {engagementStats.avgEngagementRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {actionableInsights.length > 0 && (
        <Card>
          <CardHeader title="Actionable Insights" subtitle="Prioritized recommendations from current analytics" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {actionableInsights.map((insight, index) => (
                <div key={`${insight.title}-${index}`} className="rounded-lg border border-gray-200 p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <Badge variant={insight.priority === 'HIGH' ? 'danger' : insight.priority === 'MEDIUM' ? 'warning' : 'info'}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{insight.description}</p>
                  <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" />
                    Review this in your weekly growth plan
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('reels')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'reels'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiPlay className="inline w-4 h-4 mr-2" />
          Social Activity ({reels.length})
        </button>
        <button
          onClick={() => setActiveTab('sentiment')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'sentiment'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiSmile className="inline w-4 h-4 mr-2" />
          Audience Response
        </button>
        <button
          onClick={() => setActiveTab('competitors')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'competitors'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiUsers className="inline w-4 h-4 mr-2" />
          Market Intelligence
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'campaigns'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiTarget className="inline w-4 h-4 mr-2" />
          Campaign Performance ({campaigns.length})
        </button>
      </div>

      {/* Reels Tab */}
      {activeTab === 'reels' && (
        <>
          {reels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reels.map(reel => (
                <Card
                  key={reel.id}
                  className="hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  onClick={() => {}}
                >
                  <div className="relative h-64">
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <FiPlay className="w-8 h-8 text-primary ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant="info">{reel.platform}</Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
                        {formatNumber(reel.views)} views
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-900 line-clamp-2 mb-3">{reel.caption}</p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <FiHeart className="w-4 h-4 mx-auto text-danger mb-1" />
                        <p className="text-xs font-semibold text-gray-900">
                          {formatNumber(reel.likes)}
                        </p>
                      </div>
                      <div>
                        <FiMessageCircle className="w-4 h-4 mx-auto text-info mb-1" />
                        <p className="text-xs font-semibold text-gray-900">
                          {formatNumber(reel.comments)}
                        </p>
                      </div>
                      <div>
                        <FiShare2 className="w-4 h-4 mx-auto text-success mb-1" />
                        <p className="text-xs font-semibold text-gray-900">
                          {formatNumber(reel.shares)}
                        </p>
                      </div>
                      <div>
                        <FiActivity className="w-4 h-4 mx-auto text-warning mb-1" />
                        <p className="text-xs font-semibold text-gray-900">
                          {reel.engagementRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-wrap gap-1">
                        {reel.hashtags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs text-primary bg-primary/10 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {getRelativeTime(new Date(reel.postedAt))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FiPlay />}
              title="No reels found"
              description="Start creating content to see analytics"
            />
          )}
        </>
      )}

      {/* Sentiment Analysis Tab */}
      {activeTab === 'sentiment' && sentimentData && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Analyze Reel Sentiment"
              subtitle="Paste reel URL and optional comments (one per line)"
            />
            <CardContent className="p-6 space-y-4">
              <input
                type="text"
                value={reelUrlInput}
                onChange={(e) => setReelUrlInput(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full p-3 border border-gray-300 rounded focus:ring-primary focus:border-primary"
              />
              <textarea
                value={reelCommentsInput}
                onChange={(e) => setReelCommentsInput(e.target.value)}
                placeholder={"Paste comments here, one per line\nLoved this look\nToo expensive"}
                rows={5}
                className="w-full p-3 border border-gray-300 rounded focus:ring-primary focus:border-primary"
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={handleAnalyzeReelSentiment}
                  disabled={isAnalyzingReel || !reelUrlInput.trim()}
                >
                  {isAnalyzingReel ? <><Spinner size="sm" /> &nbsp; Analyzing...</> : 'Analyze Reel'}
                </Button>
                <span className="text-sm text-gray-500">
                  Tip: Include comments for a stronger positive/negative breakdown.
                </span>
              </div>

              {reelSentimentResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                    <p className="text-sm text-gray-600">Positive</p>
                    <p className="text-xl font-bold text-success">
                      {reelSentimentResult?.sentiment_counts?.Positive ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                    <p className="text-sm text-gray-600">Neutral</p>
                    <p className="text-xl font-bold text-warning">
                      {reelSentimentResult?.sentiment_counts?.Neutral ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
                    <p className="text-sm text-gray-600">Negative</p>
                    <p className="text-xl font-bold text-danger">
                      {reelSentimentResult?.sentiment_counts?.Negative ?? 0}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overall Score</p>
                    <p className="text-3xl font-bold text-success mt-1">
                      {(sentimentData.averageSentimentScore * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <FiSmile className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Positive</p>
                    <p className="text-2xl font-bold text-success mt-1">
                      {sentimentData.positive}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sentimentData.positivePercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <FiSmile className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Neutral</p>
                    <p className="text-2xl font-bold text-warning mt-1">
                      {sentimentData.neutral}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sentimentData.neutralPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <FiMeh className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Negative</p>
                    <p className="text-2xl font-bold text-danger mt-1">
                      {sentimentData.negative}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sentimentData.negativePercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
                    <FiFrown className="w-6 h-6 text-danger" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Sentiment Distribution" />
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Positive', value: sentimentData.positive },
                        { name: 'Neutral', value: sentimentData.neutral },
                        { name: 'Negative', value: sentimentData.negative },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      <Cell fill={SENTIMENT_COLORS[SentimentType.POSITIVE]} />
                      <Cell fill={SENTIMENT_COLORS[SentimentType.NEUTRAL]} />
                      <Cell fill={SENTIMENT_COLORS[SentimentType.NEGATIVE]} />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Sentiment Trend (Last 30 Days)" />
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="positive"
                      stroke={SENTIMENT_COLORS[SentimentType.POSITIVE]}
                      strokeWidth={2}
                      name="Positive"
                    />
                    <Line
                      type="monotone"
                      dataKey="neutral"
                      stroke={SENTIMENT_COLORS[SentimentType.NEUTRAL]}
                      strokeWidth={2}
                      name="Neutral"
                    />
                    <Line
                      type="monotone"
                      dataKey="negative"
                      stroke={SENTIMENT_COLORS[SentimentType.NEGATIVE]}
                      strokeWidth={2}
                      name="Negative"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sample Comments */}
          <Card>
            <CardHeader title="Recent Comments" />
            <CardContent className="p-6">
              <div className="space-y-3">
                {sentimentData.recentComments.map((comment: Comment) => {
                  const SentimentIcon = getSentimentIcon(comment.sentiment);
                  return (
                    <div key={comment.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          comment.sentiment === SentimentType.POSITIVE
                            ? 'bg-success/10'
                            : comment.sentiment === SentimentType.NEUTRAL
                            ? 'bg-warning/10'
                            : 'bg-danger/10'
                        }`}
                      >
                        <SentimentIcon
                          className={`w-5 h-5 ${
                            comment.sentiment === SentimentType.POSITIVE
                              ? 'text-success'
                              : comment.sentiment === SentimentType.NEUTRAL
                              ? 'text-warning'
                              : 'text-danger'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">
                            @{comment.author}
                          </span>
                          <Badge
                            variant={
                              comment.sentiment === SentimentType.POSITIVE
                                ? 'success'
                                : comment.sentiment === SentimentType.NEUTRAL
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {comment.sentiment}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {getRelativeTime(new Date(comment.postedAt))}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Competitors Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Market Intelligence Workspace"
              subtitle="Monitor competitor moves, pricing signals, content patterns, and response strategy"
            />
            <CardContent className="p-6">
              
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  placeholder="https://instagram.com/competitor_brand or boutique-website.com"
                  className="flex-1 w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  disabled={isScraping}
                />
                <Button variant="primary" onClick={handleScrape} disabled={isScraping || !scrapeUrl}>
                  {isScraping ? <><Spinner size="sm"/> &nbsp; Analyzing Strategy...</> : <><FiActivity className="w-4 h-4 mr-2" /> Generate Intelligence</>}
                </Button>
              </div>

              {aiExecutiveSummary ? (
                <div className="bg-primary/5 p-6 rounded-lg mb-6 border border-primary/20">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                    <FiTarget className="w-6 h-6 mr-2 text-primary" /> Competitive Summary
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{aiExecutiveSummary}</p>
                </div>
              ) : competitors.length > 0 ? (
                <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <FiUsers className="w-6 h-6 mr-2 text-blue-600" /> Market Landscape Overview
                  </h3>
                  {/* <p className="text-sm text-gray-600 mb-4">
                    Seeded competitor data. Analyze specific competitor URLs to generate AI-powered strategic insights.
                  </p> */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {competitors.slice(0, 3).map((comp: any) => (
                      <div key={comp.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{comp.name}</h4>
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <p>📦 <strong>{comp.product_count}</strong> products</p>
                          <p>💰 Avg: <strong>${comp.avg_price?.toFixed(2)}</strong></p>
                          {comp.url && <p className="truncate text-xs text-blue-600">{comp.url}</p>}
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-2 font-medium">Quick Intel:</p>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {generateCompetitorInsights(comp).slice(0, 2).map((insight, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg mb-6 text-center text-gray-500">
                  <FiUsers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  No market intelligence generated yet. Enter a competitor URL above to build positioning, pricing, and response insights.
                </div>
              )}

              {(aiExecutiveSummary || aiAnalysisInsights.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Competitor Positioning</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {marketPositioningInsights.map((insight: string, idx: number) => (
                        <li key={`position-${idx}`} className="bg-gray-50 rounded p-3">{insight}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Pricing Signals</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {pricingSignals.map((insight: string, idx: number) => (
                        <li key={`pricing-${idx}`} className="bg-gray-50 rounded p-3">{insight}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Content Strategy Observed</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {contentStrategySignals.map((insight: string, idx: number) => (
                        <li key={`content-${idx}`} className="bg-gray-50 rounded p-3">{insight}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Risks / Weaknesses</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {riskSignals.map((insight: string, idx: number) => (
                        <li key={`risk-${idx}`} className="bg-gray-50 rounded p-3">{insight}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {(aiExecutiveSummary || aiAnalysisInsights.length > 0) && (
                <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Recommended Response</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {recommendedActions.map((insight: string, idx: number) => (
                      <li key={`response-${idx}`} className="bg-white rounded p-3 border border-primary/10">{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <>
          {campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map(campaign => (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              campaign.status === 'ACTIVE'
                                ? 'success'
                                : campaign.status === 'COMPLETED'
                                ? 'info'
                                : 'warning'
                            }
                          >
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-gray-600">{campaign.platform}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">ROI</p>
                        <p className="text-2xl font-bold text-success">{campaign.roi.toFixed(1)}x</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Budget</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(campaign.budget)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Spent</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(campaign.spent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Reach</p>
                        <p className="font-semibold text-gray-900">
                          {formatNumber(campaign.reach)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Clicks</p>
                        <p className="font-semibold text-gray-900">
                          {formatNumber(campaign.clicks)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Conversions</p>
                        <p className="font-semibold text-success">{campaign.conversions}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        {formatDate(new Date(campaign.startDate))} -{' '}
                        {formatDate(new Date(campaign.endDate))}
                      </span>
                      {campaign.status === 'ACTIVE' && (
                        <span className="text-primary font-semibold">In Progress</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FiTarget />}
              title="No campaigns found"
              description="Create marketing campaigns to track performance"
            />
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
