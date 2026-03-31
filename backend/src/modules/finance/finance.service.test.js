import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    invoice: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    ledgerEntry: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../../shared/db/prisma.js', () => ({
  prisma: prismaMock,
}));

import { financeService } from './finance.service.js';

describe('financeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists invoices with search filter', async () => {
    prismaMock.invoice.count.mockResolvedValue(1);
    prismaMock.invoice.findMany.mockResolvedValue([{ id: 'inv1' }]);

    const result = await financeService.listInvoices('org-1', 1, 20, 'PAID', 'INV-');

    expect(result.total).toBe(1);
    expect(prismaMock.invoice.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PAID',
          invoiceNumber: expect.objectContaining({ contains: 'INV-' }),
        }),
      }),
    );
  });

  it('throws conflict on duplicate invoice number', async () => {
    prismaMock.invoice.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      financeService.createInvoice('org-1', 'u1', {
        invoiceNumber: 'INV-1',
        issueDate: new Date(),
        dueDate: new Date(),
        currency: 'inr',
        subtotal: 100,
        taxAmount: 10,
        discountAmount: 0,
        totalAmount: 110,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'INVOICE_NUMBER_EXISTS',
    });
  });

  it('blocks invalid invoice status transitions', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue({ id: 'inv1', status: 'PAID' });

    await expect(financeService.updateInvoiceStatus('org-1', 'inv1', 'u1', 'PENDING')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('creates income ledger entry when invoice is marked paid without existing ledger row', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue({
      id: 'inv1',
      organizationId: 'org-1',
      status: 'PENDING',
      totalAmount: { toNumber: () => 5900 },
      invoiceNumber: 'INV-1',
    });
    prismaMock.invoice.update.mockResolvedValue({ id: 'inv1', status: 'PAID' });
    prismaMock.ledgerEntry.findFirst.mockResolvedValue(null);

    await financeService.updateInvoiceStatus('org-1', 'inv1', 'u1', 'PAID');

    expect(prismaMock.ledgerEntry.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.ledgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          invoiceId: 'inv1',
          type: 'INCOME',
          description: expect.stringContaining('INV-1'),
        }),
      }),
    );
  });

  it('computes finance stats from ledger and invoices', async () => {
    prismaMock.ledgerEntry.findMany.mockResolvedValue([
      { type: 'INCOME', amount: { toNumber: () => 1000 } },
      { type: 'EXPENSE', amount: { toNumber: () => 250 } },
    ]);
    prismaMock.invoice.findMany
      .mockResolvedValueOnce([
        { totalAmount: { toNumber: () => 300 } },
      ])
      .mockResolvedValueOnce([
        { totalAmount: { toNumber: () => 80 } },
      ]);

    const result = await financeService.stats('org-1');

    expect(result.totalRevenue).toBe(1000);
    expect(result.totalExpenses).toBe(250);
    expect(result.netProfit).toBe(750);
    expect(result.pendingAmount).toBe(300);
    expect(result.overdueAmount).toBe(80);
  });
});
