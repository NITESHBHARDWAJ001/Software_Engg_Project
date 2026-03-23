import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../shared/http/httpError.js';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    exhibition: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    exhibitionLead: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    leadInteraction: {
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (fn) => {
      if (typeof fn === 'function') {
        return fn(prismaMock);
      }
      return Promise.all(fn);
    }),
  },
}));

vi.mock('../../shared/db/prisma.js', () => ({
  prisma: prismaMock,
}));

import { exhibitionsService } from './exhibitions.service.js';

describe('exhibitionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when creating lead for missing exhibition', async () => {
    prismaMock.exhibition.findFirst.mockResolvedValue(null);

    await expect(
      exhibitionsService.createLead('org-1', 'ex-1', 'u1', {
        name: 'Lead',
        phone: '999',
        interestLevel: 'HOT',
        status: 'NEW',
        source: 'EXHIBITION',
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('computes exhibition stats summary', async () => {
    prismaMock.exhibition.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1).mockResolvedValueOnce(1);
    prismaMock.exhibitionLead.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4);
    prismaMock.exhibition.aggregate
      .mockResolvedValueOnce({ _sum: { actualRevenue: 1000 } })
      .mockResolvedValueOnce({ _sum: { budget: 500 } });

    const stats = await exhibitionsService.stats('org-1');

    expect(stats.totalExhibitions).toBe(3);
    expect(stats.totalLeads).toBe(10);
    expect(stats.conversionRate).toBe(40);
    expect(stats.roi).toBe(100);
  });

  it('calculates ROI metrics from exhibition and leads', async () => {
    prismaMock.exhibition.findFirst.mockResolvedValue({
      id: 'ex1',
      name: 'Expo',
      budget: 1000,
      actualRevenue: 0,
      leads: [
        { status: 'QUALIFIED', estimatedValue: 300 },
        { status: 'CONVERTED', estimatedValue: 400 },
        { status: 'NEW', estimatedValue: 500 },
      ],
    });

    const roi = await exhibitionsService.roi('org-1', 'ex1');

    expect(roi.totalRevenue).toBe(700);
    expect(roi.roi).toBe(-300);
    expect(roi.roiPercentage).toBe(-30);
    expect(roi.convertedLeads).toBe(1);
  });
});
