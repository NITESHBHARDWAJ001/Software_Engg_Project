import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { prisma } from '../shared/db/prisma.js';

const BASE_URL = process.env.API_TEST_BASE_URL ?? 'http://localhost:4000';
const RUN_ID = `apitest-${Date.now()}-${randomUUID().slice(0, 8)}`;
const TEST_PASSWORD = `Pass_${RUN_ID}_123456`;

const state = {
  organizationId: null,
  userId: null,
  superAdminUserId: null,
  accessToken: null,
  superAccessToken: null,
  refreshToken: null,
  customerId: null,
  inventoryItemId: null,
  invoiceId: null,
  taskId: null,
  exhibitionId: null,
  leadId: null,
  planId: null,
};

const summary = {
  passed: 0,
  failed: 0,
};

const logPass = (name) => {
  summary.passed += 1;
  console.log(`[PASS] ${name}`);
};

const logFail = (name, error) => {
  summary.failed += 1;
  console.error(`[FAIL] ${name}`);
  console.error(`       ${error instanceof Error ? error.message : String(error)}`);
};

const expect = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const buildHeaders = (withAuth = true, token = state.accessToken) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (withAuth) {
    if (!token) {
      throw new Error('Missing access token');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const apiRequest = async (
  name,
  method,
  path,
  body,
  expectedStatus = 200,
  withAuth = true,
  token = state.accessToken,
) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(withAuth, token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (response.status !== expectedStatus) {
    throw new Error(
      `${name} expected status ${expectedStatus}, got ${response.status} - ${payload?.message ?? text}`,
    );
  }

  return payload;
};

const runStep = async (name, fn) => {
  try {
    await fn();
    logPass(name);
  } catch (error) {
    logFail(name, error);
    throw error;
  }
};

const setup = async () => {
  const organization = await prisma.organization.create({
    data: {
      name: `API Test Org ${RUN_ID}`,
      slug: `api-test-${RUN_ID}`.toLowerCase(),
      email: `${RUN_ID}@example.com`,
      phone: '+910000000000',
    },
  });

  const passwordHash = await argon2.hash(TEST_PASSWORD);
  const user = await prisma.user.create({
    data: {
      email: `org-admin-${RUN_ID}@example.com`,
      passwordHash,
      firstName: 'API',
      lastName: 'Tester',
      role: 'ORG_ADMIN',
      isActive: true,
      organizationId: organization.id,
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      email: `super-admin-${RUN_ID}@example.com`,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      organizationId: null,
    },
  });

  state.organizationId = organization.id;
  state.userId = user.id;
  state.superAdminUserId = superAdmin.id;
};

const cleanup = async () => {
  if (state.superAdminUserId) {
    await prisma.refreshSession.deleteMany({ where: { userId: state.superAdminUserId } });
    await prisma.user.deleteMany({ where: { id: state.superAdminUserId } });
  }

  if (state.userId) {
    await prisma.refreshSession.deleteMany({ where: { userId: state.userId } });
    await prisma.user.deleteMany({ where: { id: state.userId } });
  }

  if (state.organizationId) {
    await prisma.organization.deleteMany({ where: { id: state.organizationId } });
  }
};

const testHealth = async () => {
  const live = await fetch(`${BASE_URL}/health/live`);
  expect(live.status === 200, `Health live expected 200, got ${live.status}`);
  const liveBody = await live.json();
  expect(liveBody.status === 'ok', 'Health live status should be ok');

  const ready = await fetch(`${BASE_URL}/health/ready`);
  expect(ready.status === 200, `Health ready expected 200, got ${ready.status}`);
  const readyBody = await ready.json();
  expect(readyBody.status === 'ready', 'Health ready status should be ready');
};

const testAuth = async () => {
  const login = await apiRequest(
    'auth login',
    'POST',
    '/api/v1/auth/login',
    {
      email: `org-admin-${RUN_ID}@example.com`,
      password: TEST_PASSWORD,
    },
    200,
    false,
  );

  expect(login.success === true, 'Login response should be success');
  expect(login.data?.accessToken, 'Login should return access token');
  expect(login.data?.refreshToken, 'Login should return refresh token');

  state.accessToken = login.data.accessToken;
  state.refreshToken = login.data.refreshToken;

  const superLogin = await apiRequest(
    'super auth login',
    'POST',
    '/api/v1/auth/login',
    {
      email: `super-admin-${RUN_ID}@example.com`,
      password: TEST_PASSWORD,
    },
    200,
    false,
  );
  state.superAccessToken = superLogin.data.accessToken;
};

const testSubscriptions = async () => {
  const plan = await apiRequest(
    'create subscription plan',
    'POST',
    '/api/v1/subscriptions/plans',
    {
      name: `Growth ${RUN_ID}`,
      code: `GROWTH_${RUN_ID.replace(/-/g, '_')}`,
      description: 'Integration test plan',
      billingCycle: 'MONTHLY',
      price: 999,
      currency: 'INR',
      features: [
        'CUSTOMER_MANAGEMENT',
        'INVENTORY_MANAGEMENT',
        'FINANCE_MANAGEMENT',
        'TASK_MANAGEMENT',
        'EXHIBITION_MANAGEMENT',
      ],
      isActive: true,
    },
    201,
    true,
    state.superAccessToken,
  );
  state.planId = plan.data.id;

  const assigned = await apiRequest(
    'assign plan to organization',
    'PUT',
    `/api/v1/subscriptions/organizations/${state.organizationId}/current`,
    {
      planId: state.planId,
      status: 'ACTIVE',
      startDate: new Date().toISOString(),
      autoRenew: true,
      includedFeatures: [],
      excludedFeatures: [],
    },
    201,
    true,
    state.superAccessToken,
  );

  expect(assigned.data.organizationId === state.organizationId, 'Assigned subscription org mismatch');
  expect(Array.isArray(assigned.data.effectiveFeatures), 'effectiveFeatures should be array');

  const me = await apiRequest('my current subscription', 'GET', '/api/v1/subscriptions/me/current');
  expect(me.data.planId === state.planId, 'Current subscription plan mismatch');

  const feature = await apiRequest(
    'feature access check',
    'GET',
    '/api/v1/subscriptions/me/features/TASK_MANAGEMENT',
  );
  expect(feature.data.hasAccess === true, 'Expected TASK_MANAGEMENT feature access');
};

const testCustomers = async () => {
  const created = await apiRequest('create customer', 'POST', '/api/v1/customers', {
    name: `Customer ${RUN_ID}`,
    email: `customer-${RUN_ID}@example.com`,
    phone: '+919999999999',
    city: 'Mumbai',
    country: 'India',
  }, 201);

  state.customerId = created.data.id;
  expect(state.customerId, 'Customer ID should be set');

  const listed = await apiRequest('list customers', 'GET', '/api/v1/customers?page=1&pageSize=20');
  expect(Array.isArray(listed.data), 'Customer list should be an array');
  expect(listed.data.some((row) => row.id === state.customerId), 'Created customer should appear in list');

  const detail = await apiRequest('get customer', 'GET', `/api/v1/customers/${state.customerId}`);
  expect(detail.data.id === state.customerId, 'Customer detail ID mismatch');

  await apiRequest('update customer', 'PATCH', `/api/v1/customers/${state.customerId}`, {
    city: 'Pune',
  });

  const stats = await apiRequest('customer stats', 'GET', '/api/v1/customers/stats');
  expect(typeof stats.data.totalCustomers === 'number', 'Customer stats should include totalCustomers');
};

const testInventory = async () => {
  const createRes = await apiRequest('create inventory item', 'POST', '/api/v1/inventory', {
    name: `Saree ${RUN_ID}`,
    sku: `SKU-${RUN_ID}`,
    category: 'SAREES',
    currentStock: 10,
    reorderLevel: 5,
    minStockLevel: 2,
    unitPrice: 1000,
    sellingPrice: 1500,
    unit: 'piece',
  }, 201);

  state.inventoryItemId = createRes.data.id;

  await apiRequest('update inventory item', 'PATCH', `/api/v1/inventory/${state.inventoryItemId}`, {
    reorderLevel: 6,
  });

  await apiRequest('adjust stock IN', 'POST', `/api/v1/inventory/${state.inventoryItemId}/adjust-stock`, {
    quantity: 5,
    changeType: 'IN',
    note: 'test stock in',
  });

  await apiRequest('adjust stock OUT', 'POST', `/api/v1/inventory/${state.inventoryItemId}/adjust-stock`, {
    quantity: 3,
    changeType: 'OUT',
    note: 'test stock out',
  });

  await apiRequest('adjust stock ADJUSTMENT', 'POST', `/api/v1/inventory/${state.inventoryItemId}/adjust-stock`, {
    quantity: -1,
    changeType: 'ADJUSTMENT',
    note: 'test adjustment',
  });

  const detail = await apiRequest('get inventory item', 'GET', `/api/v1/inventory/${state.inventoryItemId}`);
  expect(detail.data.id === state.inventoryItemId, 'Inventory detail ID mismatch');

  const list = await apiRequest('list inventory', 'GET', '/api/v1/inventory?page=1&pageSize=20&search=SKU-');
  expect(Array.isArray(list.data), 'Inventory list should be array');

  const movements = await apiRequest('inventory movements', 'GET', `/api/v1/inventory/${state.inventoryItemId}/movements`);
  expect(Array.isArray(movements.data), 'Inventory movements should be array');
  expect(movements.data.length >= 3, 'Inventory movements should include created adjustments');

  const alerts = await apiRequest('inventory alerts', 'GET', '/api/v1/inventory/alerts/low-stock');
  expect(Array.isArray(alerts.data), 'Inventory alerts should be array');

  const categoryAnalytics = await apiRequest('inventory category analytics', 'GET', '/api/v1/inventory/analytics/categories');
  expect(Array.isArray(categoryAnalytics.data), 'Inventory category analytics should be array');

  const stats = await apiRequest('inventory stats', 'GET', '/api/v1/inventory/stats');
  expect(typeof stats.data.totalItems === 'number', 'Inventory stats should include totalItems');
};

const testFinance = async () => {
  const invoiceNumber = `INV-${RUN_ID}`;

  const invoice = await apiRequest('create invoice', 'POST', '/api/v1/finance/invoices', {
    invoiceNumber,
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    currency: 'INR',
    subtotal: 5000,
    taxAmount: 900,
    discountAmount: 0,
    totalAmount: 5900,
    notes: 'integration test invoice',
  }, 201);

  state.invoiceId = invoice.data.id;

  await apiRequest('update invoice', 'PATCH', `/api/v1/finance/invoices/${state.invoiceId}`, {
    notes: 'updated by integration test',
  });

  await apiRequest('invoice status to pending', 'PATCH', `/api/v1/finance/invoices/${state.invoiceId}/status`, {
    status: 'PENDING',
  });

  await apiRequest('invoice status to paid', 'PATCH', `/api/v1/finance/invoices/${state.invoiceId}/status`, {
    status: 'PAID',
  });

  const invoiceDetail = await apiRequest('get invoice', 'GET', `/api/v1/finance/invoices/${state.invoiceId}`);
  expect(invoiceDetail.data.id === state.invoiceId, 'Invoice detail ID mismatch');

  const list = await apiRequest(
    'list invoices with search',
    'GET',
    `/api/v1/finance/invoices?page=1&pageSize=20&search=${encodeURIComponent(invoiceNumber)}`,
  );
  expect(Array.isArray(list.data), 'Invoice list should be array');
  expect(list.data.some((row) => row.id === state.invoiceId), 'Created invoice should be in list');

  await apiRequest('create ledger income', 'POST', '/api/v1/finance/ledger', {
    invoiceId: state.invoiceId,
    type: 'INCOME',
    amount: 5900,
    entryDate: new Date().toISOString(),
    category: 'Sales',
    description: 'invoice payment',
  }, 201);

  await apiRequest('create ledger expense', 'POST', '/api/v1/finance/ledger', {
    type: 'EXPENSE',
    amount: 1200,
    entryDate: new Date().toISOString(),
    category: 'Marketing',
    description: 'campaign spend',
  }, 201);

  const ledger = await apiRequest('list ledger', 'GET', '/api/v1/finance/ledger?page=1&pageSize=20');
  expect(Array.isArray(ledger.data), 'Ledger list should be array');

  const cashFlow = await apiRequest('finance cash-flow', 'GET', '/api/v1/finance/analytics/cash-flow');
  expect(typeof cashFlow.data.income === 'number', 'Cash-flow should include income');

  const trends = await apiRequest('finance trends', 'GET', '/api/v1/finance/analytics/trends?groupBy=month');
  expect(Array.isArray(trends.data), 'Finance trends should be array');

  const stats = await apiRequest('finance stats', 'GET', '/api/v1/finance/analytics/stats');
  expect(typeof stats.data.totalRevenue === 'number', 'Finance stats should include totalRevenue');
};

const testExhibitions = async () => {
  const now = Date.now();
  const exhibition = await apiRequest('create exhibition', 'POST', '/api/v1/exhibitions', {
    name: `Exhibition ${RUN_ID}`,
    description: 'integration test exhibition',
    location: 'Mumbai',
    startDate: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'UPCOMING',
    budget: 10000,
    actualSpent: 0,
    expectedRevenue: 50000,
    actualRevenue: 0,
    expectedFootfall: 300,
    assignedStaff: [state.userId],
  }, 201);

  state.exhibitionId = exhibition.data.id;

  await apiRequest('update exhibition', 'PATCH', `/api/v1/exhibitions/${state.exhibitionId}`, {
    actualSpent: 2000,
  });

  const list = await apiRequest('list exhibitions', 'GET', '/api/v1/exhibitions?page=1&pageSize=20');
  expect(Array.isArray(list.data), 'Exhibition list should be array');

  const stats = await apiRequest('exhibition stats', 'GET', '/api/v1/exhibitions/stats');
  expect(typeof stats.data.totalExhibitions === 'number', 'Exhibition stats should include totalExhibitions');

  const detail = await apiRequest('get exhibition', 'GET', `/api/v1/exhibitions/${state.exhibitionId}`);
  expect(detail.data.id === state.exhibitionId, 'Exhibition detail ID mismatch');

  const lead = await apiRequest('create exhibition lead', 'POST', `/api/v1/exhibitions/${state.exhibitionId}/leads`, {
    name: `Lead ${RUN_ID}`,
    phone: '+918888888888',
    email: `lead-${RUN_ID}@example.com`,
    company: 'Lead Co',
    interestLevel: 'HOT',
    status: 'NEW',
    interestedProducts: ['SAREES'],
    estimatedValue: 20000,
  }, 201);

  state.leadId = lead.data.id;

  await apiRequest('update exhibition lead', 'PATCH', `/api/v1/exhibitions/${state.exhibitionId}/leads/${state.leadId}`, {
    status: 'QUALIFIED',
    notes: 'lead qualified',
  });

  const leads = await apiRequest('list exhibition leads', 'GET', `/api/v1/exhibitions/${state.exhibitionId}/leads`);
  expect(Array.isArray(leads.data), 'Exhibition leads should be array');
  expect(leads.data.some((row) => row.id === state.leadId), 'Created lead should be listed');

  await apiRequest('create lead interaction', 'POST', `/api/v1/exhibitions/leads/${state.leadId}/interactions`, {
    type: 'NOTE',
    notes: 'follow-up note',
  }, 201);

  const roi = await apiRequest('exhibition roi', 'GET', `/api/v1/exhibitions/${state.exhibitionId}/roi`);
  expect(typeof roi.data.roiPercentage === 'number', 'ROI should include roiPercentage');
};

const testTasks = async () => {
  const task = await apiRequest('create task', 'POST', '/api/v1/tasks', {
    title: `Task ${RUN_ID}`,
    description: 'integration test task',
    status: 'TODO',
    priority: 'HIGH',
    assignedTo: state.userId,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['api', 'test'],
    attachments: [],
    relatedExhibitionId: state.exhibitionId,
    relatedCustomerId: state.customerId,
  }, 201);

  state.taskId = task.data.id;

  await apiRequest('update task', 'PATCH', `/api/v1/tasks/${state.taskId}`, {
    priority: 'URGENT',
  });

  await apiRequest('update task status', 'PATCH', `/api/v1/tasks/${state.taskId}/status`, {
    status: 'IN_PROGRESS',
  });

  const list = await apiRequest('list tasks', 'GET', '/api/v1/tasks?page=1&pageSize=20');
  expect(Array.isArray(list.data), 'Task list should be array');

  const stats = await apiRequest('task stats', 'GET', '/api/v1/tasks/stats');
  expect(typeof stats.data.total === 'number', 'Task stats should include total');

  const detail = await apiRequest('get task', 'GET', `/api/v1/tasks/${state.taskId}`);
  expect(detail.data.id === state.taskId, 'Task detail ID mismatch');

  await apiRequest('add task comment', 'POST', `/api/v1/tasks/${state.taskId}/comments`, {
    content: 'integration test comment',
  }, 201);

  const comments = await apiRequest('list task comments', 'GET', `/api/v1/tasks/${state.taskId}/comments`);
  expect(Array.isArray(comments.data), 'Task comments should be array');
  expect(comments.data.length >= 1, 'Task comments should include the created comment');

  await apiRequest('delete task', 'DELETE', `/api/v1/tasks/${state.taskId}`);
};

const archiveCustomerAtEnd = async () => {
  await apiRequest('archive customer', 'DELETE', `/api/v1/customers/${state.customerId}`);
};

const main = async () => {
  console.log(`Running API integration tests against ${BASE_URL}`);
  console.log(`Run ID: ${RUN_ID}`);

  try {
    await runStep('Health endpoints', testHealth);
    await runStep('Setup test tenant', setup);
    await runStep('Auth login flow', testAuth);
    await runStep('Subscriptions module', testSubscriptions);
    await runStep('Customers module', testCustomers);
    await runStep('Inventory module', testInventory);
    await runStep('Finance module', testFinance);
    await runStep('Exhibitions module', testExhibitions);
    await runStep('Tasks module', testTasks);
    await runStep('Archive customer', archiveCustomerAtEnd);
  } finally {
    await cleanup().catch((error) => {
      console.error('[WARN] Cleanup failed:', error instanceof Error ? error.message : String(error));
    });

    await prisma.$disconnect();
  }

  console.log('');
  console.log('========== Test Summary ==========');
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('[FATAL]', error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
