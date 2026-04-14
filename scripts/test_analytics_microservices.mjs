#!/usr/bin/env node

const backendBase = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:4000';
const analyticsApiBase = process.env.ANALYTICS_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
const analyticsHealthUrl = process.env.ANALYTICS_HEALTH_URL || 'http://127.0.0.1:8000/health';

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
      mark(name, false, `HTTP ${response.status} non-JSON response: ${text.slice(0, 200)}`);
      return { ok: false };
    }

    if (!response.ok) {
      mark(name, false, `HTTP ${response.status} ${JSON.stringify(json).slice(0, 240)}`);
      return { ok: false, status: response.status, json };
    }

    mark(name, true, `HTTP ${response.status}`);
    return { ok: true, status: response.status, json };
  } catch (error) {
    mark(name, false, error.message);
    return { ok: false };
  }
};

const requireCondition = (name, condition, details) => {
  mark(name, Boolean(condition), details);
  return Boolean(condition);
};

const main = async () => {
  console.log('Running analytics microservices sync tests...');
  console.log(`Backend: ${backendBase}`);
  console.log(`Analytics API: ${analyticsApiBase}`);

  const live = await requestJson({
    name: 'Backend live health',
    url: `${backendBase}/health/live`,
  });
  const ready = await requestJson({
    name: 'Backend ready health',
    url: `${backendBase}/health/ready`,
  });
  const analyticsHealth = await requestJson({
    name: 'Analytics health',
    url: analyticsHealthUrl,
  });
  const analyticsRoot = await requestJson({
    name: 'Analytics API root',
    url: `${analyticsApiBase}/`,
  });

  if (!live.ok || !ready.ok || !analyticsHealth.ok || !analyticsRoot.ok) {
    throw new Error('Health checks failed. Start backend and analytics before running this script.');
  }

  const ts = Date.now();
  const registerBody = {
    organizationName: `Sync Test Org ${ts}`,
    adminName: 'Sync Test Admin',
    email: `sync.test.${ts}@example.com`,
    password: 'StrongPass123!',
  };

  const registerRes = await requestJson({
    name: 'Register org admin via backend',
    url: `${backendBase}/api/v1/auth/register`,
    method: 'POST',
    body: registerBody,
  });
  if (!registerRes.ok) throw new Error('Registration failed.');

  const authData = registerRes.json?.data;
  const accessToken = authData?.accessToken;
  const orgId = authData?.user?.organizationId;

  if (!requireCondition('Access token issued', typeof accessToken === 'string' && accessToken.length > 20, 'Token missing from register response')) {
    throw new Error('No access token returned by registration flow.');
  }
  if (!requireCondition('Organization ID issued', typeof orgId === 'string' && orgId.length > 10, 'Organization ID missing from register response')) {
    throw new Error('No organizationId returned by registration flow.');
  }

  const sku = `SYNC-${ts}`;
  const inventoryBody = {
    name: 'Sync Test Item',
    sku,
    category: 'sync-test',
    currentStock: 12,
    reorderLevel: 4,
    minStockLevel: 2,
    unitPrice: 49.5,
    sellingPrice: 80,
    unit: 'piece',
  };

  const inventoryCreate = await requestJson({
    name: 'Create inventory item via backend',
    url: `${backendBase}/api/v1/inventory`,
    method: 'POST',
    token: accessToken,
    body: inventoryBody,
  });
  if (!inventoryCreate.ok) throw new Error('Inventory create failed.');

  const syncRes = await requestJson({
    name: 'Trigger backend -> analytics stock sync (AUTO)',
    url: `${backendBase}/api/v1/analytics/stock-context/sync`,
    method: 'POST',
    token: accessToken,
    body: { sourceMode: 'AUTO', limit: 100 },
  });
  if (!syncRes.ok) throw new Error('Stock context sync failed.');

  const backendManual = await requestJson({
    name: 'Backend analytics manual-check endpoint',
    url: `${backendBase}/api/v1/analytics/stock-context/manual-check`,
    method: 'GET',
    token: accessToken,
  });
  if (!backendManual.ok) throw new Error('Backend manual-check failed.');

  const backendRows = Array.isArray(backendManual.json?.data) ? backendManual.json.data : [];
  requireCondition('Backend manual-check has rows', backendRows.length > 0, `Rows: ${backendRows.length}`);
  requireCondition('Backend manual-check includes created SKU', backendRows.some((r) => r?.sku === sku), `Expected SKU: ${sku}`);

  const directManual = await requestJson({
    name: 'Direct analytics manual-check endpoint',
    url: `${analyticsApiBase}/stock-context/manual-check?org_id=${encodeURIComponent(orgId)}`,
  });
  if (!directManual.ok) throw new Error('Direct analytics manual-check failed.');

  const directRows = Array.isArray(directManual.json?.data) ? directManual.json.data : [];
  requireCondition('Direct analytics has rows', directRows.length > 0, `Rows: ${directRows.length}`);
  requireCondition('Direct analytics includes created SKU', directRows.some((r) => r?.sku === sku), `Expected SKU: ${sku}`);

  const dashboardChecks = [
    ['Dashboard competitors', `${backendBase}/api/v1/analytics/dashboard/competitors`],
    ['Dashboard pricing trends', `${backendBase}/api/v1/analytics/dashboard/pricing-trends?days=7`],
    ['Dashboard sentiment', `${backendBase}/api/v1/analytics/dashboard/sentiment`],
    ['Dashboard insights', `${backendBase}/api/v1/analytics/dashboard/insights?limit=5`],
    ['Dashboard products', `${backendBase}/api/v1/analytics/dashboard/products?page=1&limit=10`],
  ];

  for (const [name, url] of dashboardChecks) {
    const res = await requestJson({ name, url, token: accessToken });
    if (!res.ok) throw new Error(`${name} failed.`);
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
  console.error(`\nTest run failed: ${error.message}`);
  process.exit(1);
});
