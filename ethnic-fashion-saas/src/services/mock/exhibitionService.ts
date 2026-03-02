// Mock data service for Exhibition Management
import { Exhibition, ExhibitionStatus, ExhibitionLead, LeadInterestLevel, LeadStatus, ExhibitionROI } from '../../types';
import { generateId } from '../../utils/helpers';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockExhibitions: Exhibition[] = [
  {
    id: 'exh-1',
    organizationId: 'org-1',
    name: 'Mumbai Fashion Week 2026',
    description: 'Premium fashion exhibition showcasing ethnic designer wear',
    location: 'Jio World Convention Centre, Mumbai',
    startDate: new Date('2026-04-15').toISOString(),
    endDate: new Date('2026-04-18').toISOString(),
    status: ExhibitionStatus.UPCOMING,
    budget: 450000,
    actualSpent: 0,
    expectedRevenue: 2500000,
    actualRevenue: 0,
    expectedFootfall: 15000,
    boothSize: '10m x 12m',
    totalLeads: 0,
    convertedLeads: 0,
    createdBy: 'user-1',
    createdAt: new Date('2026-02-01').toISOString(),
    updatedAt: new Date().toISOString(),
    assignedStaff: ['user-1', 'user-2', 'user-3'],
    notes: 'Premium booth location near main entrance. Focus on designer saree collection.',
  },
  {
    id: 'exh-2',
    organizationId: 'org-1',
    name: 'Delhi Textile Expo',
    description: 'Traditional textile and ethnic wear exhibition',
    location: 'Pragati Maidan, New Delhi',
    startDate: new Date('2026-03-10').toISOString(),
    endDate: new Date('2026-03-13').toISOString(),
    status: ExhibitionStatus.ACTIVE,
    budget: 325000,
    actualSpent: 320000,
    expectedRevenue: 1800000,
    actualRevenue: 950000,
    expectedFootfall: 12000,
    actualFootfall: 8450,
    boothSize: '8m x 10m',
    totalLeads: 2,
    convertedLeads: 0,
    createdBy: 'user-1',
    createdAt: new Date('2026-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
    assignedStaff: ['user-2', 'user-4'],
    notes: 'Traditional wear showcase with live demos.',
  },
  {
    id: 'exh-3',
    organizationId: 'org-1',
    name: 'Bangalore Saree Fair',
    description: 'South Indian silk saree and ethnic fashion exhibition',
    location: 'BIEC, Bangalore',
    startDate: new Date('2026-01-20').toISOString(),
    endDate: new Date('2026-01-23').toISOString(),
    status: ExhibitionStatus.COMPLETED,
    budget: 280000,
    actualSpent: 275000,
    expectedRevenue: 1500000,
    actualRevenue: 1850000,
    expectedFootfall: 10000,
    actualFootfall: 11500,
    boothSize: '8m x 8m',
    totalLeads: 1,
    convertedLeads: 1,
    createdBy: 'user-1',
    createdAt: new Date('2025-12-01').toISOString(),
    updatedAt: new Date('2026-01-25').toISOString(),
    assignedStaff: ['user-1', 'user-3'],
    notes: 'Highly successful event. 115% footfall achieved.',
  },
];

const mockLeads: ExhibitionLead[] = [
  {
    id: 'lead-1',
    exhibitionId: 'exh-2',
    organizationId: 'org-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98765 43210',
    company: 'Elegant Boutique',
    interestLevel: LeadInterestLevel.HOT,
    status: LeadStatus.NEW,
    interestedProducts: ['Designer Sarees', 'Bridal Collection'],
    estimatedValue: 250000,
    notes: 'Looking for bulk order. Wants exclusive designs.',
    capturedBy: 'user-2',
    capturedByName: 'Manager User',
    source: 'EXHIBITION',
    capturedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lead-2',
    exhibitionId: 'exh-2',
    organizationId: 'org-1',
    name: 'Rajesh Kumar',
    email: 'rajesh.k@retailstore.com',
    phone: '+91 98765 12345',
    company: 'Fashion Hub',
    interestLevel: LeadInterestLevel.WARM,
    status: LeadStatus.CONTACTED,
    interestedProducts: ['Cotton Sarees', 'Silk Collection'],
    estimatedValue: 150000,
    notes: 'Interested in seasonal collection. Follow up needed.',
    capturedBy: 'user-4',
    capturedByName: 'Staff User',
    source: 'EXHIBITION',
    capturedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-3',
    exhibitionId: 'exh-3',
    organizationId: 'org-1',
    name: 'Anita Desai',
    email: 'anita@fashionworld.com',
    phone: '+91 98765 67890',
    company: 'Fashion World Retail',
    interestLevel: LeadInterestLevel.HOT,
    status: LeadStatus.QUALIFIED,
    interestedProducts: ['Designer Sarees', 'Wedding Collection'],
    estimatedValue: 450000,
    notes: 'VIP customer. Converted to qualified lead. Order placed.',
    capturedBy: 'user-1',
    capturedByName: 'Admin User',
    source: 'EXHIBITION',
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    capturedAt: new Date('2026-01-21').toISOString(),
    createdAt: new Date('2026-01-21').toISOString(),
    updatedAt: new Date('2026-01-24').toISOString(),
  },
];

export const exhibitionService = {
  async getAllExhibitions(organizationId: string): Promise<Exhibition[]> {
    await delay(600);
    return mockExhibitions.filter(exh => exh.organizationId === organizationId);
  },

  async getExhibitionById(exhibitionId: string): Promise<Exhibition | null> {
    await delay(400);
    return mockExhibitions.find(exh => exh.id === exhibitionId) || null;
  },

  async getExhibitionsByStatus(organizationId: string, status: ExhibitionStatus): Promise<Exhibition[]> {
    await delay(500);
    return mockExhibitions.filter(
      exh => exh.organizationId === organizationId && exh.status === status
    );
  },

  async getExhibitionLeads(exhibitionId: string): Promise<ExhibitionLead[]> {
    await delay(500);
    return mockLeads.filter(lead => lead.exhibitionId === exhibitionId);
  },

  async createLead(leadData: Omit<ExhibitionLead, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExhibitionLead> {
    await delay(700);
    const newLead: ExhibitionLead = {
      ...leadData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockLeads.push(newLead);
    return newLead;
  },

  async updateLead(leadId: string, updates: Partial<ExhibitionLead>): Promise<ExhibitionLead> {
    await delay(500);
    const leadIndex = mockLeads.findIndex(l => l.id === leadId);
    if (leadIndex === -1) {
      throw new Error('Lead not found');
    }
    
    mockLeads[leadIndex] = {
      ...mockLeads[leadIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return mockLeads[leadIndex];
  },

  async getExhibitionROI(exhibitionId: string): Promise<ExhibitionROI> {
    await delay(600);
    const exhibition = mockExhibitions.find(exh => exh.id === exhibitionId);
    const leads = mockLeads.filter(lead => lead.exhibitionId === exhibitionId);
    
    const totalRevenue = leads.reduce((sum, lead) => {
      if (lead.status === LeadStatus.QUALIFIED || lead.status === LeadStatus.CONVERTED) {
        return sum + (lead.estimatedValue || 0);
      }
      return sum;
    }, 0);

    const budget = exhibition?.budget || 0;
    const totalInvestment = budget;
    const revenue = totalRevenue;
    const roi = totalRevenue - budget;
    const roiPercentage = budget > 0 ? ((totalRevenue - budget) / budget) * 100 : 0;
    const roisPercentage = roiPercentage;
    const totalLeads = leads.length;
    const conversions = leads.filter(l => l.status === LeadStatus.CONVERTED).length;
    const convertedLeads = conversions;

    return {
      exhibitionId,
      exhibitionName: exhibition?.name || 'Unknown',
      budget,
      totalInvestment,
      revenue,
      totalRevenue,
      roi,
      roisPercentage,
      roiPercentage,
      leads: totalLeads,
      totalLeads,
      conversions,
      convertedLeads,
      conversionRate: totalLeads > 0 ? (conversions / totalLeads) * 100 : 0,
    };
  },

  async createExhibition(exhibitionData: Omit<Exhibition, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exhibition> {
    await delay(700);
    const newExhibition: Exhibition = {
      ...exhibitionData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockExhibitions.push(newExhibition);
    return newExhibition;
  },

  async updateExhibition(exhibitionId: string, updates: Partial<Exhibition>): Promise<Exhibition> {
    await delay(600);
    const exhIndex = mockExhibitions.findIndex(e => e.id === exhibitionId);
    if (exhIndex === -1) {
      throw new Error('Exhibition not found');
    }
    
    mockExhibitions[exhIndex] = {
      ...mockExhibitions[exhIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return mockExhibitions[exhIndex];
  },
};
