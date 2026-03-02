export enum ExhibitionStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum LeadInterestLevel {
  COLD = 'COLD',
  WARM = 'WARM',
  HOT = 'HOT',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  NEGOTIATION = 'NEGOTIATION',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}

export interface Exhibition {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: ExhibitionStatus;
  budget: number;
  actualSpent: number;
  expectedRevenue: number;
  actualRevenue: number;
  expectedFootfall?: number;
  actualFootfall?: number;
  boothSize?: string;
  stallNumber?: string;
  category?: string;
  assignedStaff: string[];
  assignedStaffNames?: string[];
  totalLeads: number;
  convertedLeads: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  notes?: string;
}

export interface ExhibitionLead {
  id: string;
  exhibitionId: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  interestLevel: LeadInterestLevel;
  status: LeadStatus;
  interestedProducts: string[];
  notes?: string;
  capturedBy: string;
  capturedByName: string;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
  followUpDate?: string;
  lastContactedDate?: string;
  source: 'EXHIBITION' | 'REFERRAL' | 'WEBSITE' | 'OTHER';
  estimatedValue?: number;
  interactions?: LeadInteraction[];
}

export interface LeadInteraction {
  id: string;
  leadId: string;
  userId: string;
  userName: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  notes: string;
  createdAt: string;
}

export interface ExhibitionStats {
  totalExhibitions: number;
  ongoingExhibitions: number;
  completedExhibitions: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: number;
  totalBudget: number;
  roi: number;
}

export interface ExhibitionROI {
  exhibitionId: string;
  exhibitionName: string;
  budget: number;
  totalInvestment: number;
  revenue: number;
  totalRevenue: number;
  roi: number;
  roisPercentage: number;
  roiPercentage: number;
  leads: number;
  totalLeads: number;
  conversions: number;
  convertedLeads: number;
  conversionRate: number;
}
