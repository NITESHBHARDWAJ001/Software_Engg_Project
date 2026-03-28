import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

const InvoiceStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
};

const LedgerEntryType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
};

const asDecimal = (value) => new Prisma.Decimal(value);

const ALLOWED_STATUS_TRANSITIONS = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.PENDING, InvoiceStatus.PAID],
  [InvoiceStatus.PENDING]: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE],
  [InvoiceStatus.OVERDUE]: [InvoiceStatus.PAID],
  [InvoiceStatus.PAID]: [InvoiceStatus.PAID],
};

const defaultRange = (from, to) => {
  const end = to ?? new Date();
  const start = from ?? new Date(end.getFullYear(), end.getMonth() - 11, 1);
  return { start, end };
};

export const financeService = {
  async listInvoices(organizationId, page, pageSize, status, search) {
    const where = {
      organizationId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            invoiceNumber: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { total, invoices };
  },

  async getInvoiceById(organizationId, id) {
    const invoice = await prisma.invoice.findFirst({ where: { id, organizationId } });
    if (!invoice) {
      throw new HttpError(404, 'Invoice not found', 'INVOICE_NOT_FOUND');
    }
    return invoice;
  },

  async createInvoice(organizationId, userId, payload) {
    try {
      return await prisma.invoice.create({
        data: {
          organizationId,
          invoiceNumber: payload.invoiceNumber,
          issueDate: payload.issueDate,
          dueDate: payload.dueDate,
          currency: payload.currency.toUpperCase(),
          subtotal: asDecimal(payload.subtotal),
          taxAmount: asDecimal(payload.taxAmount),
          discountAmount: asDecimal(payload.discountAmount),
          totalAmount: asDecimal(payload.totalAmount),
          notes: payload.notes,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpError(409, 'Invoice number already exists for this organization', 'INVOICE_NUMBER_EXISTS');
      }
      throw error;
    }
  },

  async updateInvoice(organizationId, id, userId, payload) {
    await this.getInvoiceById(organizationId, id);

    return prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber: payload.invoiceNumber,
        issueDate: payload.issueDate,
        dueDate: payload.dueDate,
        currency: payload.currency?.toUpperCase(),
        subtotal: payload.subtotal !== undefined ? asDecimal(payload.subtotal) : undefined,
        taxAmount: payload.taxAmount !== undefined ? asDecimal(payload.taxAmount) : undefined,
        discountAmount: payload.discountAmount !== undefined ? asDecimal(payload.discountAmount) : undefined,
        totalAmount: payload.totalAmount !== undefined ? asDecimal(payload.totalAmount) : undefined,
        notes: payload.notes,
        updatedBy: userId,
      },
    });
  },

  async updateInvoiceStatus(organizationId, id, userId, status, paidAt) {
    const invoice = await this.getInvoiceById(organizationId, id);
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[invoice.status] ?? [];
    if (!allowedTransitions.includes(status)) {
      throw new HttpError(
        400,
        `Invalid invoice status transition from ${invoice.status} to ${status}`,
        'INVALID_INVOICE_STATUS_TRANSITION',
      );
    }

    return prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAt: status === InvoiceStatus.PAID ? paidAt ?? new Date() : null,
        updatedBy: userId,
      },
    });
  },

  async listLedger(organizationId, page, pageSize, type, from, to) {
    const where = {
      organizationId,
      ...(type ? { type } : {}),
      ...(from || to
        ? {
            entryDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [total, entries] = await Promise.all([
      prisma.ledgerEntry.count({ where }),
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { total, entries };
  },

  async createLedgerEntry(organizationId, userId, payload) {
    if (payload.invoiceId) {
      const invoice = await prisma.invoice.findFirst({ where: { id: payload.invoiceId, organizationId } });
      if (!invoice) {
        throw new HttpError(404, 'Invoice not found for this organization', 'INVOICE_NOT_FOUND');
      }
    }

    return prisma.ledgerEntry.create({
      data: {
        organizationId,
        invoiceId: payload.invoiceId,
        type: payload.type,
        amount: asDecimal(payload.amount),
        entryDate: payload.entryDate,
        category: payload.category,
        description: payload.description,
        createdBy: userId,
      },
    });
  },

  async cashFlowSummary(organizationId, from, to) {
    const { start, end } = defaultRange(from, to);
    const entries = await prisma.ledgerEntry.findMany({
      where: {
        organizationId,
        entryDate: { gte: start, lte: end },
      },
      select: { type: true, amount: true },
    });

    const income = entries
      .filter((entry) => entry.type === LedgerEntryType.INCOME)
      .reduce((sum, entry) => sum + entry.amount.toNumber(), 0);

    const expense = entries
      .filter((entry) => entry.type === LedgerEntryType.EXPENSE)
      .reduce((sum, entry) => sum + entry.amount.toNumber(), 0);

    return {
      from: start,
      to: end,
      income,
      expense,
      net: income - expense,
    };
  },

  async revenueExpenseTrends(organizationId, from, to, groupBy = 'month') {
    const { start, end } = defaultRange(from, to);
    const entries = await prisma.ledgerEntry.findMany({
      where: {
        organizationId,
        entryDate: { gte: start, lte: end },
        type: { in: [LedgerEntryType.INCOME, LedgerEntryType.EXPENSE] },
      },
      select: { type: true, amount: true, entryDate: true },
      orderBy: { entryDate: 'asc' },
    });

    const buckets = new Map();

    for (const entry of entries) {
      const date = entry.entryDate;
      const key =
        groupBy === 'day'
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
      if (entry.type === LedgerEntryType.INCOME) {
        bucket.income += entry.amount.toNumber();
      }
      if (entry.type === LedgerEntryType.EXPENSE) {
        bucket.expense += entry.amount.toNumber();
      }
      buckets.set(key, bucket);
    }

    return [...buckets.entries()].map(([period, values]) => ({
      period,
      income: values.income,
      expense: values.expense,
      net: values.income - values.expense,
    }));
  },

  async stats(organizationId, from, to) {
    const { start, end } = defaultRange(from, to);

    const [cashFlow, pendingInvoices, overdueInvoices] = await Promise.all([
      this.cashFlowSummary(organizationId, start, end),
      prisma.invoice.findMany({
        where: { organizationId, status: InvoiceStatus.PENDING },
        select: { totalAmount: true },
      }),
      prisma.invoice.findMany({
        where: { organizationId, status: InvoiceStatus.OVERDUE },
        select: { totalAmount: true },
      }),
    ]);

    const pendingAmount = pendingInvoices.reduce((sum, row) => sum + row.totalAmount.toNumber(), 0);
    const overdueAmount = overdueInvoices.reduce((sum, row) => sum + row.totalAmount.toNumber(), 0);

    return {
      totalRevenue: cashFlow.income,
      totalExpenses: cashFlow.expense,
      netProfit: cashFlow.net,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      pendingAmount,
      overdueAmount,
      period: {
        from: cashFlow.from,
        to: cashFlow.to,
      },
    };
  },
};
