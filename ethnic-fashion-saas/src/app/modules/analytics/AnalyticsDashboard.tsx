import React, { useEffect, useState } from 'react';
import {
  FiBarChart,
  FiTrendingUp,
  FiSmile,
  FiTarget,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { analyticsService } from '../../../services/api/analyticsService';
import { useDashboardWebSocket } from '../../../hooks/useDashboardWebSocket';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: '#06A77D',
  Neutral: '#F59E0B',
  Negative: '#E63946',
  Unknown: '#6B7280',
};

const COMPETITOR_COLORS = ['#7B2CBF', '#9D4EDD', '#C77DFF', '#E0AAFF', '#5A189A'];

interface Competitor {
  id: number;
  name: string;
  url: string;
  product_count: number;
  avg_price: number;
  last_scraped: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  currency: string;
  image_url: string;
  competitor: string;
}

interface PricingTrendData {
  date: string;
  [key: string]: string | number;
}

interface SentimentData {
  Positive: number;
  Neutral: number;
  Negative: number;
  Unknown: number;
}

interface Insight {
  generated_at: string;
  summary: string;
}

export const AnalyticsDashboard: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [pricingData, setPricingData] = useState<PricingTrendData[]>([]);
  const [sentiments, setSentiments] = useState<SentimentData>({
    Positive: 0,
    Neutral: 0,
    Negative: 0,
    Unknown: 0,
  });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // WebSocket for real-time updates
  useDashboardWebSocket('test-org', true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [comp, pricing, sentiment, topInsights, prod] = await Promise.all([
        analyticsService.getCompetitorsSummary(),
        analyticsService.getPricingTrends(30),
        analyticsService.getSentimentBreakdown(),
        analyticsService.getTopInsights(5),
        analyticsService.getProductsByCategory(1, 20),
      ]);

      setCompetitors(comp.data || []);
      setPricingData(pricing.data || []);
      setSentiments(sentiment.data || {});
      setInsights(topInsights.data || []);
      setProducts(prod.data || []);
      setTotalPages(prod.pagination?.pages || 1);
    } catch (error) {
      console.error('[AnalyticsDashboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Listen for WebSocket events
    const handleScrapeComplete = () => {
      console.log('[AnalyticsDashboard] Scrape complete event received');
      loadDashboardData();
    };

    const handleDashboardUpdate = (event: any) => {
      console.log('[AnalyticsDashboard] Dashboard update event received:', event.detail);
      if (event.detail.updateType === 'competitors') {
        setCompetitors(event.detail.data);
      } else if (event.detail.updateType === 'pricing') {
        setPricingData(event.detail.data);
      }
    };

    window.addEventListener('dashboard:scrape-complete', handleScrapeComplete);
    window.addEventListener('dashboard:update', handleDashboardUpdate);

    return () => {
      window.removeEventListener('dashboard:scrape-complete', handleScrapeComplete);
      window.removeEventListener('dashboard:update', handleDashboardUpdate);
    };
  }, []);

  const handlePageChange = async (page: number) => {
    setLoading(true);
    try {
      const result = await analyticsService.getProductsByCategory(page, 20);
      setProducts(result.data || []);
      setTotalPages(result.pagination?.pages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error('[AnalyticsDashboard] Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const sentimentChartData = [
    { name: 'Positive', value: sentiments.Positive },
    { name: 'Neutral', value: sentiments.Neutral },
    { name: 'Negative', value: sentiments.Negative },
  ].filter((item) => item.value > 0);

  const competitorStats = competitors.map((c) => ({
    name: c.name,
    products: c.product_count,
    avgPrice: c.avg_price,
  }));

  if (loading && competitors.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor competitor activity and market trends</p>
        </div>
        <Button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Competitors Tracked</p>
                <p className="text-3xl font-bold text-gray-900">{competitors.length}</p>
              </div>
              <FiTarget className="text-4xl text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">
                  {competitors.reduce((sum, c) => sum + c.product_count, 0)}
                </p>
              </div>
              <FiBarChart className="text-4xl text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Price</p>
                <p className="text-3xl font-bold text-gray-900">
                  $
                  {competitors.length > 0
                    ? (competitors.reduce((sum, c) => sum + c.avg_price, 0) / competitors.length).toFixed(2)
                    : '0.00'}
                </p>
              </div>
              <FiTrendingUp className="text-4xl text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Positive Sentiment</p>
                <p className="text-3xl font-bold text-green-600">
                  {sentiments.Positive > 0
                    ? Math.round(
                        (sentiments.Positive /
                          (sentiments.Positive + sentiments.Neutral + sentiments.Negative)) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <FiSmile className="text-4xl text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pricing Trends */}
        <Card>
          <CardHeader title="Pricing Trends (30 Days)" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pricingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any) => `$${value.toFixed(2)}`}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                {competitors.map((comp, idx) => (
                  <Line
                    key={comp.id}
                    type="monotone"
                    dataKey={comp.name}
                    stroke={COMPETITOR_COLORS[idx % COMPETITOR_COLORS.length]}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card>
          <CardHeader title="Sentiment Breakdown" />
          <CardContent>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Comparison */}
      <Card>
        <CardHeader title="Competitor Comparison" />
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={competitorStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'Products', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: 'Avg Price ($)', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="products" fill="#7B2CBF" name="Products" />
              <Bar yAxisId="right" dataKey="avgPrice" fill="#C77DFF" name="Avg Price ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader title="AI Insights" />
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                  <p className="text-sm text-gray-500">{new Date(insight.generated_at).toLocaleDateString()}</p>
                  <p className="text-gray-700">{insight.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader title="Tracked Products" />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Product Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Competitor</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Price</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category}</td>
                    <td className="px-4 py-3 text-gray-600">{product.competitor}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {product.currency} {product.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
