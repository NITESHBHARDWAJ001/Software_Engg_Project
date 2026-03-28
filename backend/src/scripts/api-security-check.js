import { randomUUID } from 'node:crypto';

const BASE_URL = process.env.API_TEST_BASE_URL ?? 'http://localhost:4000';
const ORG_ADMIN_EMAIL = process.env.MASTER_SEED_ORG_ADMIN_EMAIL ?? 'orgadmin@example.com';
const ORG_ADMIN_PASSWORD = process.env.MASTER_SEED_ORG_ADMIN_PASSWORD ?? 'OrgAdminStrongPass123!';
const STAFF_EMAIL = process.env.MASTER_SEED_STAFF_EMAIL ?? 'staff@example.com';
const STAFF_PASSWORD = process.env.MASTER_SEED_STAFF_PASSWORD ?? 'StaffStrongPass123!';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? 'admin@example.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeThisStrongPassword123!';

const RUN_ID = `seccheck-${Date.now()}-${randomUUID().slice(0, 6)}`;

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

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const request = async ({ method, path, token, body }) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return { status: response.status, payload, headers: response.headers };
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

const login = async (email, password) => {
  const { status, payload } = await request({
    method: 'POST',
    path: '/api/v1/auth/login',
    body: { email, password },
  });

  if (status !== 200) {
    throw new Error(`Login failed for ${email}: ${status} ${payload?.message ?? ''}`);
  }

  return payload.data;
};

const main = async () => {
  console.log(`Running API security checks against ${BASE_URL}`);

  let orgToken;
  let staffToken;
  let superToken;
  let orgId;
  let tempPlanId;

  try {
    await run('Security headers present on health route', async () => {
      const { status, headers } = await request({ method: 'GET', path: '/health/live' });
      assert(status === 200, 'health/live must return 200');
      assert(headers.get('x-content-type-options') === 'nosniff', 'Missing x-content-type-options');
      assert(headers.get('x-frame-options') === 'SAMEORIGIN', 'Missing x-frame-options');
    });

    await run('Unauthorized access blocked', async () => {
      const { status, payload } = await request({ method: 'GET', path: '/api/v1/customers' });
      assert(status === 401, `Expected 401, got ${status}`);
      assert(payload?.code === 'UNAUTHORIZED', 'Expected UNAUTHORIZED code');
    });

    await run('Login seeded users', async () => {
      const org = await login(ORG_ADMIN_EMAIL, ORG_ADMIN_PASSWORD);
      const staff = await login(STAFF_EMAIL, STAFF_PASSWORD);
      const sup = await login(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);

      orgToken = org.accessToken;
      staffToken = staff.accessToken;
      superToken = sup.accessToken;
      orgId = org.user.organizationId;

      assert(Boolean(orgToken), 'Missing org token');
      assert(Boolean(staffToken), 'Missing staff token');
      assert(Boolean(superToken), 'Missing super token');
      assert(Boolean(orgId), 'Missing org id');
    });

    await run('RBAC: staff cannot create customer', async () => {
      const { status } = await request({
        method: 'POST',
        path: '/api/v1/customers',
        token: staffToken,
        body: { name: `Blocked ${RUN_ID}`, email: `${RUN_ID}@example.com` },
      });
      assert(status === 403, `Expected 403, got ${status}`);
    });

    await run('RBAC: org admin cannot create subscription plan', async () => {
      const { status } = await request({
        method: 'POST',
        path: '/api/v1/subscriptions/plans',
        token: orgToken,
        body: {
          name: 'Should Not Work',
          code: `NOPE_${RUN_ID}`,
          billingCycle: 'MONTHLY',
          price: 100,
          currency: 'INR',
          features: ['CUSTOMER_MANAGEMENT'],
        },
      });
      assert(status === 403, `Expected 403, got ${status}`);
    });

    await run('Super admin can create temporary restricted plan', async () => {
      const { status, payload } = await request({
        method: 'POST',
        path: '/api/v1/subscriptions/plans',
        token: superToken,
        body: {
          name: `Restricted ${RUN_ID}`,
          code: `RESTRICTED_${RUN_ID.replace(/-/g, '_').toUpperCase()}`,
          billingCycle: 'MONTHLY',
          price: 199,
          currency: 'INR',
          features: ['CUSTOMER_MANAGEMENT', 'INVENTORY_MANAGEMENT'],
          isActive: true,
        },
      });

      assert(status === 201, `Expected 201, got ${status}`);
      tempPlanId = payload?.data?.id;
      assert(Boolean(tempPlanId), 'Missing temp plan id');
    });

    await run('Feature gate blocks finance when not subscribed', async () => {
      const assign = await request({
        method: 'PUT',
        path: `/api/v1/subscriptions/organizations/${orgId}/current`,
        token: superToken,
        body: {
          planId: tempPlanId,
          status: 'ACTIVE',
          startDate: new Date().toISOString(),
          autoRenew: true,
          includedFeatures: [],
          excludedFeatures: [],
        },
      });
      assert(assign.status === 201, `Expected 201 on assign, got ${assign.status}`);

      const blocked = await request({ method: 'GET', path: '/api/v1/finance/invoices?page=1&pageSize=10', token: orgToken });
      assert(blocked.status === 403, `Expected 403 for finance, got ${blocked.status}`);
      assert(blocked.payload?.code === 'FEATURE_FORBIDDEN', 'Expected FEATURE_FORBIDDEN code');
    });

    await run('Restore growth plan and finance access', async () => {
      const plans = await request({ method: 'GET', path: '/api/v1/subscriptions/plans?activeOnly=true', token: superToken });
      assert(plans.status === 200, `Expected 200, got ${plans.status}`);

      const growth = plans.payload?.data?.find((p) => p.code === 'GROWTH');
      assert(Boolean(growth?.id), 'GROWTH plan not found');

      const restore = await request({
        method: 'PUT',
        path: `/api/v1/subscriptions/organizations/${orgId}/current`,
        token: superToken,
        body: {
          planId: growth.id,
          status: 'ACTIVE',
          startDate: new Date().toISOString(),
          autoRenew: true,
          includedFeatures: [],
          excludedFeatures: [],
        },
      });
      assert(restore.status === 201, `Expected 201 on restore, got ${restore.status}`);

      const finance = await request({ method: 'GET', path: '/api/v1/finance/invoices?page=1&pageSize=10', token: orgToken });
      assert(finance.status === 200, `Expected 200 finance access, got ${finance.status}`);
    });

    await run('Super admin can deactivate temporary plan', async () => {
      const result = await request({
        method: 'DELETE',
        path: `/api/v1/subscriptions/plans/${tempPlanId}`,
        token: superToken,
      });
      assert(result.status === 200, `Expected 200, got ${result.status}`);
    });
  } finally {
    console.log('');
    console.log('========== API Security Report ==========' );
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
