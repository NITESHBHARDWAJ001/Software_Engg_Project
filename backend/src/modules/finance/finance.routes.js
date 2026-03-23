import { Router } from 'express';
import { ok, paged } from '../../shared/http/response.js';
import { HttpError } from '../../shared/http/httpError.js';
import { authGuard } from '../../shared/middleware/auth.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { getOrganizationScope, tenantGuard } from '../../shared/middleware/tenant.js';
import {
  financeListQuerySchema,
  financeTrendQuerySchema,
  invoiceCreateSchema,
  invoiceStatusSchema,
  invoiceUpdateSchema,
  ledgerCreateSchema,
  ledgerListQuerySchema,
} from './finance.schemas.js';
import { financeService } from './finance.service.js';
import { requireFeatureAccess } from '../../shared/middleware/featureAccess.js';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';

export const financeRouter = Router();
financeRouter.use(authGuard, tenantGuard);
financeRouter.use(requireFeatureAccess('FINANCE_MANAGEMENT'));

financeRouter.get('/invoices', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  const query = financeListQuerySchema.parse(req.query);

  const { invoices, total } = await financeService.listInvoices(
    organizationId,
    query.page,
    query.pageSize,
    query.status,
    query.search,
  );
  res.json(paged(invoices, query.page, query.pageSize, total));
});

financeRouter.post('/invoices', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  const payload = invoiceCreateSchema.parse(req.body);

  const invoice = await financeService.createInvoice(organizationId, req.auth.userId, payload);
  res.status(201).json(ok(invoice, 'Invoice created'));
});

financeRouter.get('/invoices/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const invoice = await financeService.getInvoiceById(organizationId, id);
  res.json(ok(invoice));
});

financeRouter.patch('/invoices/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = invoiceUpdateSchema.parse(req.body);

  const invoice = await financeService.updateInvoice(organizationId, id, req.auth.userId, payload);
  res.json(ok(invoice, 'Invoice updated'));
});

financeRouter.patch('/invoices/:id/status', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = invoiceStatusSchema.parse(req.body);

  const invoice = await financeService.updateInvoiceStatus(
    organizationId,
    id,
    req.auth.userId,
    payload.status,
    payload.paidAt,
  );
  res.json(ok(invoice, 'Invoice status updated'));
});

financeRouter.get('/ledger', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  const query = ledgerListQuerySchema.parse(req.query);

  const { entries, total } = await financeService.listLedger(
    organizationId,
    query.page,
    query.pageSize,
    query.type,
    query.from,
    query.to,
  );
  res.json(paged(entries, query.page, query.pageSize, total));
});

financeRouter.post('/ledger', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  const payload = ledgerCreateSchema.parse(req.body);

  const entry = await financeService.createLedgerEntry(organizationId, req.auth.userId, payload);
  res.status(201).json(ok(entry, 'Ledger entry created'));
});

financeRouter.get('/analytics/cash-flow', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  const query = financeTrendQuerySchema.parse(req.query);

  const summary = await financeService.cashFlowSummary(organizationId, query.from, query.to);
  res.json(ok(summary));
});

financeRouter.get('/analytics/trends', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  const query = financeTrendQuerySchema.parse(req.query);

  const trends = await financeService.revenueExpenseTrends(organizationId, query.from, query.to, query.groupBy);
  res.json(ok(trends));
});

financeRouter.get('/analytics/stats', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  const query = financeTrendQuerySchema.parse(req.query);

  const stats = await financeService.stats(organizationId, query.from, query.to);
  res.json(ok(stats));
});
