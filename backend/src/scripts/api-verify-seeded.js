const BASE_URL = process.env.API_TEST_BASE_URL ?? 'http://localhost:4000';
const ORG_ADMIN_EMAIL = process.env.MASTER_SEED_ORG_ADMIN_EMAIL ?? 'orgadmin@example.com';
const ORG_ADMIN_PASSWORD = process.env.MASTER_SEED_ORG_ADMIN_PASSWORD ?? 'OrgAdminStrongPass123!';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? 'admin@example.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeThisStrongPassword123!';

const summary = {
  passed: 0,
  failed: 0,
};

const pass = (name) => {
  summary.passed += 1;
  console.log(`[PASS] ${name}`);
};

const fail = (name, error) => {
  summary.failed += 1;
  console.error(`[FAIL] ${name}`);
  console.error(`       ${error instanceof Error ? error.message : String(error)}`);
};

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const request = async ({ name, method, path, token, body, expected = 200, headers = {} }) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (response.status !== expected) {
    throw new Error(`${name} expected ${expected}, got ${response.status} (${payload?.message ?? text})`);
  }

  return payload;
};

const run = async (name, fn) => {
  try {
    await fn();
    pass(name);
  } catch (error) {
    fail(name, error);
    throw error;
  }
};

const main = async () => {
  let orgToken;
  let superToken;
  let orgId;

  console.log(`Verifying seeded APIs against ${BASE_URL}`);

  try {
    await run('Health endpoints', async () => {
      const live = await fetch(`${BASE_URL}/health/live`);
      expect(live.status === 200, 'health/live should return 200');
      const ready = await fetch(`${BASE_URL}/health/ready`);
      expect(ready.status === 200, 'health/ready should return 200');
    });

    await run('Login org admin', async () => {
      const login = await request({
        name: 'org login',
        method: 'POST',
        path: '/api/v1/auth/login',
        expected: 200,
        body: { email: ORG_ADMIN_EMAIL, password: ORG_ADMIN_PASSWORD },
      });

      orgToken = login.data.accessToken;
      orgId = login.data.user.organizationId;
      expect(Boolean(orgToken), 'Org token missing');
      expect(Boolean(orgId), 'Org ID missing');
    });

    await run('Login super admin', async () => {
      const login = await request({
        name: 'super login',
        method: 'POST',
        path: '/api/v1/auth/login',
        expected: 200,
        body: { email: SUPER_ADMIN_EMAIL, password: SUPER_ADMIN_PASSWORD },
      });

      superToken = login.data.accessToken;
      expect(Boolean(superToken), 'Super token missing');
    });

    await run('Subscription APIs', async () => {
      const plans = await request({
        name: 'plans list',
        method: 'GET',
        path: '/api/v1/subscriptions/plans?activeOnly=true',
        token: orgToken,
      });
      expect(Array.isArray(plans.data), 'Plans should be an array');
      expect(plans.data.length > 0, 'Plans should not be empty');

      const current = await request({
        name: 'org current subscription',
        method: 'GET',
        path: '/api/v1/subscriptions/me/current',
        token: orgToken,
      });
      expect(Boolean(current.data?.planId), 'Current subscription should include planId');

      const orgCurrent = await request({
        name: 'super org current subscription',
        method: 'GET',
        path: `/api/v1/subscriptions/organizations/${orgId}/current`,
        token: superToken,
      });
      expect(Boolean(orgCurrent.data?.id), 'Super org current subscription should return id');
    });

    await run('Customers APIs', async () => {
      const list = await request({ name: 'customers list', method: 'GET', path: '/api/v1/customers?page=1&pageSize=20', token: orgToken });
      expect(Array.isArray(list.data), 'Customers list should be array');

      const stats = await request({ name: 'customers stats', method: 'GET', path: '/api/v1/customers/stats', token: orgToken });
      expect(typeof stats.data.totalCustomers === 'number', 'Customer stats should include totalCustomers');
    });

    await run('Inventory APIs', async () => {
      const list = await request({ name: 'inventory list', method: 'GET', path: '/api/v1/inventory?page=1&pageSize=20', token: orgToken });
      expect(Array.isArray(list.data), 'Inventory list should be array');

      const stats = await request({ name: 'inventory stats', method: 'GET', path: '/api/v1/inventory/stats', token: orgToken });
      expect(typeof stats.data.totalItems === 'number', 'Inventory stats should include totalItems');
    });

    await run('Finance APIs', async () => {
      const invoices = await request({ name: 'finance invoices', method: 'GET', path: '/api/v1/finance/invoices?page=1&pageSize=20', token: orgToken });
      expect(Array.isArray(invoices.data), 'Finance invoices should be array');

      const stats = await request({ name: 'finance stats', method: 'GET', path: '/api/v1/finance/analytics/stats', token: orgToken });
      expect(typeof stats.data.totalRevenue === 'number', 'Finance stats should include totalRevenue');
    });

    await run('Tasks APIs', async () => {
      const list = await request({ name: 'tasks list', method: 'GET', path: '/api/v1/tasks?page=1&pageSize=20', token: orgToken });
      expect(Array.isArray(list.data), 'Tasks list should be array');

      const stats = await request({ name: 'tasks stats', method: 'GET', path: '/api/v1/tasks/stats', token: orgToken });
      expect(typeof stats.data.total === 'number', 'Task stats should include total');
    });

    await run('Exhibitions APIs', async () => {
      const list = await request({ name: 'exhibitions list', method: 'GET', path: '/api/v1/exhibitions?page=1&pageSize=20', token: orgToken });
      expect(Array.isArray(list.data), 'Exhibitions list should be array');

      const stats = await request({ name: 'exhibitions stats', method: 'GET', path: '/api/v1/exhibitions/stats', token: orgToken });
      expect(typeof stats.data.totalExhibitions === 'number', 'Exhibitions stats should include totalExhibitions');
    });

    await run('Notifications APIs', async () => {
      const unread = await request({
        name: 'notifications unread',
        method: 'GET',
        path: '/api/v1/notifications?read=false',
        token: orgToken,
      });
      expect(Array.isArray(unread.data), 'Unread notifications should be an array');
      expect(unread.data.length > 0, 'Unread notifications should not be empty');

      const all = await request({
        name: 'notifications all',
        method: 'GET',
        path: '/api/v1/notifications',
        token: orgToken,
      });
      expect(Array.isArray(all.data), 'Notifications list should be an array');
    });
  } finally {
    console.log('');
    console.log('========== Seeded API Verification ==========' );
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);

    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  }
};

main().catch((error) => {
  console.error('[FATAL]', error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
