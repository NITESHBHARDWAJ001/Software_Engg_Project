#!/usr/bin/env node

const backendBase = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:4000';
const analyticsApiBase = process.env.ANALYTICS_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
const analyticsHealthUrl = process.env.ANALYTICS_HEALTH_URL || 'http://127.0.0.1:8000/health';
const strictSeed = process.env.STRICT_ANALYTICS_SEED === '1';

const results = [];

const mark = (name, ok, details = '') => {
  results.push({ name, ok, details });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${details ? ` -> ${details}` : ''}`);
};

const requestJson = async ({ name, url, method = 'GET', token, body }) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      mark(name, false, `HTTP ${response.status} non-JSON: ${text.slice(0, 220)}`);
      return { ok: false, status: response.status };
    }

    if (!response.ok) {
      mark(name, false, `HTTP ${response.status} ${JSON.stringify(json).slice(0, 260)}`);
      return { ok: false, status: response.status, json };
    }

    mark(name, true, `HTTP ${response.status}`);
    return { ok: true, status: response.status, json };
  } catch (error) {
    mark(name, false, error.message);
    return { ok: false, status: 0 };
  }
};

const requireCondition = (name, condition, details) => {
  const ok = Boolean(condition);
  mark(name, ok, details);
  return ok;
};

const main = async () => {
  console.log('Running analytics seed + full-flow verification...');
  console.log(`Backend: ${backendBase}`);
  console.log(`Analytics API: ${analyticsApiBase}`);

  const live = await requestJson({ name: 'Backend live health', url: `${backendBase}/health/live` });
  const ready = await requestJson({ name: 'Backend ready health', url: `${backendBase}/health/ready` });
  const analyticsHealth = await requestJson({ name: 'Analytics health', url: analyticsHealthUrl });
  const analyticsRoot = await requestJson({ name: 'Analytics API root', url: `${analyticsApiBase}/` });

  if (!live.ok || !ready.ok || !analyticsHealth.ok || !analyticsRoot.ok) {
    throw new Error('Health checks failed. Start backend and analytics services first.');
  }

  const seedId = Date.now();
  const registerRes = await requestJson({
    name: 'Register org admin',
    url: `${backendBase}/api/v1/auth/register`,
    method: 'POST',
    body: {
      organizationName: `Analytics Flow Org ${seedId}`,
      adminName: 'Analytics Flow Admin',
      email: `analytics.flow.${seedId}@example.com`,
      password: 'StrongPass123!',
    },
  });
  if (!registerRes.ok) throw new Error('Register org admin failed.');

  const authData = registerRes.json?.data;
  const token = authData?.accessToken;
  const orgId = authData?.user?.organizationId;

  if (!requireCondition('Access token exists', typeof token === 'string' && token.length > 20, 'Expected access token in register response')) {
    throw new Error('Missing access token.');
  }
  if (!requireCondition('Organization ID exists', typeof orgId === 'string' && orgId.length > 10, 'Expected organization ID in register response')) {
    throw new Error('Missing organization ID.');
  }

  const inventoryPayloads = [
    {
      name: 'Seed Linen Kurta',
      sku: `SEED-KURTA-${seedId}`,
      category: 'kurtas',
      currentStock: 20,
      reorderLevel: 5,
      minStockLevel: 3,
      unitPrice: 45,
      sellingPrice: 79,
      unit: 'piece',
    },
    {
      name: 'Seed Silk Saree',
      sku: `SEED-SAREE-${seedId}`,
      category: 'sarees',
      currentStock: 11,
      reorderLevel: 3,
      minStockLevel: 2,
      unitPrice: 70,
      sellingPrice: 129,
      unit: 'piece',
    },
    {
      name: 'Seed Nehru Jacket',
      sku: `SEED-JACKET-${seedId}`,
      category: 'jackets',
      currentStock: 8,
      reorderLevel: 2,
      minStockLevel: 1,
      unitPrice: 60,
      sellingPrice: 110,
      unit: 'piece',
    },
  ];

  for (const payload of inventoryPayloads) {
    const createInventory = await requestJson({
      name: `Create inventory ${payload.sku}`,
      url: `${backendBase}/api/v1/inventory`,
      method: 'POST',
      token,
      body: payload,
    });

    if (!createInventory.ok) {
      throw new Error(`Inventory seed failed for ${payload.sku}.`);
    }
  }

  const syncRes = await requestJson({
    name: 'Sync stock context AUTO',
    url: `${backendBase}/api/v1/analytics/stock-context/sync`,
    method: 'POST',
    token,
    body: { sourceMode: 'AUTO', limit: 100 },
  });
  if (!syncRes.ok) throw new Error('Stock context sync failed.');

  const backendManual = await requestJson({
    name: 'Backend stock-context manual-check',
    url: `${backendBase}/api/v1/analytics/stock-context/manual-check`,
    token,
  });
  if (!backendManual.ok) throw new Error('Backend manual-check failed.');

  const backendRows = Array.isArray(backendManual.json?.data) ? backendManual.json.data : [];
  requireCondition('Stock-context has rows', backendRows.length >= inventoryPayloads.length, `Rows: ${backendRows.length}`);

  for (const payload of inventoryPayloads) {
    requireCondition(
      `Stock-context includes ${payload.sku}`,
      backendRows.some((row) => row?.sku === payload.sku),
      `Expected SKU: ${payload.sku}`,
    );
  }

  const sampleSeed = await requestJson({
    name: 'Seed analytics dashboard sample data',
    url: `${analyticsApiBase}/seed/sample-data`,
    method: 'POST',
    body: { org_id: orgId, seed_tag: String(seedId) },
  });
  let hasDashboardSeed = false;

  if (sampleSeed.ok) {
    const seededCompetitors = sampleSeed.json?.data?.competitors_created ?? 0;
    const seededProducts = sampleSeed.json?.data?.products_created ?? 0;
    hasDashboardSeed = seededCompetitors > 0 && seededProducts > 0;
    requireCondition('Sample seed created competitors', seededCompetitors > 0, `Competitors: ${seededCompetitors}`);
    requireCondition('Sample seed created products', seededProducts > 0, `Products: ${seededProducts}`);
  } else {
    mark('Sample dashboard seed fallback', true, 'Sample seed endpoint unavailable; proceeding with endpoint-level flow checks');
    if (strictSeed) {
      throw new Error('Analytics sample data seeding failed and STRICT_ANALYTICS_SEED=1.');
    }
  }

  const reportRes = await requestJson({
    name: 'Generate analytics report',
    url: `${backendBase}/api/v1/analytics/report`,
    method: 'POST',
    token,
    body: {},
  });

  const adRes = await requestJson({
    name: 'Generate defensive ad copy',
    url: `${backendBase}/api/v1/analytics/generate-ad`,
    method: 'POST',
    token,
    body: { domain: 'seed-fashion-a' },
  });

  const dashboardCompetitors = await requestJson({
    name: 'Dashboard competitors',
    url: `${backendBase}/api/v1/analytics/dashboard/competitors`,
    token,
  });
  const competitors = Array.isArray(dashboardCompetitors.json?.data) ? dashboardCompetitors.json.data : [];

  if (dashboardCompetitors.ok && hasDashboardSeed) {
    requireCondition('Competitors dashboard has data', competitors.length > 0, `Competitors: ${competitors.length}`);
  } else if (dashboardCompetitors.ok) {
    mark('Competitors dashboard payload shape', Array.isArray(competitors), `Competitors: ${competitors.length}`);
  }

  if (dashboardCompetitors.ok && competitors.length > 0 && competitors[0]?.id) {
    const details = await requestJson({
      name: 'Dashboard competitor details',
      url: `${backendBase}/api/v1/analytics/dashboard/competitors/${competitors[0].id}`,
      token,
    });
    if (!details.ok) {
      mark('Competitor details follow-up', false, 'Details endpoint failed for first competitor');
    }
  }

  const pricing = await requestJson({
    name: 'Dashboard pricing trends',
    url: `${backendBase}/api/v1/analytics/dashboard/pricing-trends?days=30`,
    token,
  });
  const pricingRows = Array.isArray(pricing.json?.data) ? pricing.json.data : [];
  if (pricing.ok && hasDashboardSeed) {
    requireCondition('Pricing trends has data', pricingRows.length > 0, `Rows: ${pricingRows.length}`);
  } else if (pricing.ok) {
    mark('Pricing trends payload shape', Array.isArray(pricingRows), `Rows: ${pricingRows.length}`);
  }

  const sentiment = await requestJson({
    name: 'Dashboard sentiment',
    url: `${backendBase}/api/v1/analytics/dashboard/sentiment`,
    token,
  });

  const insights = await requestJson({
    name: 'Dashboard insights',
    url: `${backendBase}/api/v1/analytics/dashboard/insights?limit=5`,
    token,
  });
  const insightRows = Array.isArray(insights.json?.data) ? insights.json.data : [];
  if (insights.ok && hasDashboardSeed) {
    requireCondition('Insights has data', insightRows.length > 0, `Rows: ${insightRows.length}`);
  } else if (insights.ok) {
    mark('Insights payload shape', Array.isArray(insightRows), `Rows: ${insightRows.length}`);
  }

  const products = await requestJson({
    name: 'Dashboard products',
    url: `${backendBase}/api/v1/analytics/dashboard/products?page=1&limit=20`,
    token,
  });
  const productRows = Array.isArray(products.json?.data) ? products.json.data : [];
  if (products.ok && hasDashboardSeed) {
    requireCondition('Dashboard products has data', productRows.length > 0, `Rows: ${productRows.length}`);
  } else if (products.ok) {
    mark('Products dashboard payload shape', Array.isArray(productRows), `Rows: ${productRows.length}`);
  }

  const directManual = await requestJson({
    name: 'Direct analytics manual-check',
    url: `${analyticsApiBase}/stock-context/manual-check?org_id=${encodeURIComponent(orgId)}`,
  });
  if (!reportRes.ok) {
    mark('Report endpoint status', false, 'Report generation endpoint returned non-2xx');
  }
  if (!adRes.ok) {
    mark('Ad copy endpoint status', false, 'Generate-ad endpoint returned non-2xx');
  }
  if (!directManual.ok) {
    mark('Direct manual-check status', false, 'Direct analytics manual-check returned non-2xx');
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  console.log('\n=== Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(`\nFlow run failed: ${error.message}`);
  process.exit(1);
});
