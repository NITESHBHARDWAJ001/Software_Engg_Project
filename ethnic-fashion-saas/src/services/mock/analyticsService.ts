// Lightweight mock implementation for analytics service (used in dev/testing)

function delay(ms = 500) {
  return new Promise((res) => setTimeout(res, ms));
}

let lastScrapeUrl: string | null = null;

const mockCompetitors = [
  { id: 1, name: 'BohoBoutique', url: 'https://bohoboutique.example', product_count: 120, avg_price: 45.5, last_scraped: new Date().toISOString() },
  { id: 2, name: 'EthnicElegance', url: 'https://ethnicelegance.example', product_count: 98, avg_price: 58.2, last_scraped: new Date().toISOString() },
  { id: 3, name: 'TraditionThreads', url: 'https://traditionthreads.example', product_count: 76, avg_price: 39.99, last_scraped: new Date().toISOString() },
];

const mockProducts = Array.from({ length: 50 }).map((_, idx) => ({
  id: idx + 1,
  name: `Product ${idx + 1}`,
  category: ['Sarees', 'Lehengas', 'Kurtas'][idx % 3],
  price: +(20 + Math.random() * 80).toFixed(2),
  currency: '$',
  image_url: '',
  competitor: mockCompetitors[idx % mockCompetitors.length].name,
}));

export const mockAnalyticsService = {
  async triggerScrape(url: string) {
    lastScrapeUrl = url;
    await delay(900 + Math.random() * 600);
    // simulate backend broadcast
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dashboard:scrape-complete', { detail: { url } }));
    }
    return { ok: true };
  },

  async getAiReport(_orgId?: string) {
    await delay(300);
    const summary = lastScrapeUrl
      ? `Quick executive summary for ${lastScrapeUrl}: competitor pricing is mixed; look for opportunities in value bundles and targeted reels.`
      : 'No recent scrape data available. Trigger a scrape to generate an AI report.';

    const insights = [
      'Top sellers use mid-price positioning with frequent limited-time discounts.',
      'High engagement reels correlate with product bundles and influencer tags.',
      'Consider promoting hand-crafted tags to increase perceived value.',
    ];

    return {
      data: {
        executive_summary: summary,
        analysis: {
          insights,
        },
      },
    };
  },

  async generateAdCopy(domain: string) {
    await delay(200);
    return {
      data: {
        ad_copy: `Discover exclusive ${domain} collections — handpicked styles, limited stock. Shop now!`,
      },
    };
  },

  async getCompetitorsSummary() {
    await delay(250);
    return { data: mockCompetitors };
  },

  async getCompetitorDetails(competitorId: number) {
    await delay(200);
    const found = mockCompetitors.find((c) => c.id === competitorId) ?? null;
    return { data: found };
  },

  async getPricingTrends(days: number = 30) {
    await delay(200);
    const dates = Array.from({ length: days }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const row: any = { date: d.toISOString().slice(0, 10) };
      mockCompetitors.forEach((c) => {
        row[c.name] = +(c.avg_price + (Math.random() * 10 - 5)).toFixed(2);
      });
      return row;
    });
    return { data: dates };
  },

  async getSentimentBreakdown() {
    await delay(180);
    const data = {
      Positive: 120,
      Neutral: 45,
      Negative: 18,
      Unknown: 7,
      recentComments: [
        { id: 1, author: 'alice', text: 'Love this collection!', sentiment: 'POSITIVE', postedAt: new Date().toISOString() },
        { id: 2, author: 'bob', text: 'Sizing seems off.', sentiment: 'NEGATIVE', postedAt: new Date().toISOString() },
      ],
    };
    return { data };
  },

  async getTopInsights(limit: number = 5) {
    await delay(120);
    const items = [
      { generated_at: new Date().toISOString(), summary: 'Price gap found between Product A and B — consider strategic bundling.' },
      { generated_at: new Date().toISOString(), summary: 'Reels with behind-the-scenes content get 2x engagement.' },
    ].slice(0, limit);
    return { data: items };
  },

  async getProductsByCategory(page: number = 1, limit: number = 20) {
    await delay(200);
    const start = (page - 1) * limit;
    const chunk = mockProducts.slice(start, start + limit);
    return { data: chunk, pagination: { pages: Math.ceil(mockProducts.length / limit) } };
  },
};

export default mockAnalyticsService;
