import { useEffect, useState } from 'react';
import {
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiPlus,
  FiEye,
  FiEdit,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTarget,
} from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useOrganizationStore } from '../../../store/organizationStore';
import { Exhibition, ExhibitionStatus, ExhibitionLead, LeadInterestLevel, ExhibitionROI } from '../../../types';
import { exhibitionService } from '../../../services/mock/exhibitionService';
import { formatCurrency, formatDate, getRelativeTime } from '../../../utils/helpers';

type ViewMode = 'list' | 'calendar' | 'analytics';

export default function ExhibitionsPage() {
  const { currentOrganization } = useOrganizationStore();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [exhibitionLeads, setExhibitionLeads] = useState<ExhibitionLead[]>([]);
  const [exhibitionROI, setExhibitionROI] = useState<ExhibitionROI | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStatus, setSelectedStatus] = useState<ExhibitionStatus | 'all'>('all');

  useEffect(() => {
    if (currentOrganization) {
      loadExhibitions();
    }
  }, [currentOrganization]);

  const loadExhibitions = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const data = await exhibitionService.getAllExhibitions(currentOrganization.id);
      setExhibitions(data);
    } catch (error) {
      console.error('Error loading exhibitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExhibitionDetails = async (exhibition: Exhibition) => {
    setSelectedExhibition(exhibition);
    try {
      const [leads, roi] = await Promise.all([
        exhibitionService.getExhibitionLeads(exhibition.id),
        exhibitionService.getExhibitionROI(exhibition.id),
      ]);
      setExhibitionLeads(leads);
      setExhibitionROI(roi);
    } catch (error) {
      console.error('Error loading exhibition details:', error);
    }
  };

  const getStatusColor = (status: ExhibitionStatus) => {
    switch (status) {
      case ExhibitionStatus.ACTIVE:
        return 'success';
      case ExhibitionStatus.UPCOMING:
        return 'primary';
      case ExhibitionStatus.COMPLETED:
        return 'info';
      case ExhibitionStatus.CANCELLED:
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getStatusIcon = (status: ExhibitionStatus) => {
    switch (status) {
      case ExhibitionStatus.ACTIVE:
        return FiCheckCircle;
      case ExhibitionStatus.UPCOMING:
        return FiClock;
      case ExhibitionStatus.COMPLETED:
        return FiTarget;
      default:
        return FiAlertCircle;
    }
  };

  const getInterestColor = (interest: LeadInterestLevel) => {
    switch (interest) {
      case LeadInterestLevel.HOT:
        return 'danger';
      case LeadInterestLevel.WARM:
        return 'warning';
      case LeadInterestLevel.COLD:
        return 'info';
      default:
        return 'neutral';
    }
  };

  const filteredExhibitions = selectedStatus === 'all'
    ? exhibitions
    : exhibitions.filter(exh => exh.status === selectedStatus);

  const stats = {
    total: exhibitions.length,
    upcoming: exhibitions.filter(e => e.status === ExhibitionStatus.UPCOMING).length,
    active: exhibitions.filter(e => e.status === ExhibitionStatus.ACTIVE).length,
    completed: exhibitions.filter(e => e.status === ExhibitionStatus.COMPLETED).length,
    totalBudget: exhibitions.reduce((sum, e) => sum + e.budget, 0),
    avgFootfall: exhibitions.filter(e => e.actualFootfall).reduce((sum, e) => sum + (e.actualFootfall || 0), 0) / 
      exhibitions.filter(e => e.actualFootfall).length || 0,
  };

  // ROI chart data
  const roiData = exhibitions
    .filter(e => e.status === ExhibitionStatus.COMPLETED)
    .map(e => ({
      name: e.name.substring(0, 15) + '...',
      budget: e.budget / 1000,
      footfall: e.actualFootfall || 0,
    }));

  // Lead funnel data
  const leadFunnelData = exhibitionLeads.length > 0 ? [
    { name: 'Total Leads', value: exhibitionLeads.length },
    { name: 'Contacted', value: exhibitionLeads.filter(l => l.status === 'CONTACTED' || l.status === 'QUALIFIED' || l.status === 'CONVERTED').length },
    { name: 'Qualified', value: exhibitionLeads.filter(l => l.status === 'QUALIFIED' || l.status === 'CONVERTED').length },
    { name: 'Converted', value: exhibitionLeads.filter(l => l.status === 'CONVERTED').length },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Detail View
  if (selectedExhibition) {
    const StatusIcon = getStatusIcon(selectedExhibition.status);
    
    return (
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedExhibition(null)}>
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedExhibition.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={getStatusColor(selectedExhibition.status)}>
                  <StatusIcon className="w-3 h-3" />
                  {selectedExhibition.status}
                </Badge>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <FiMapPin className="w-4 h-4" />
                  {selectedExhibition.location}
                </span>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  {formatDate(selectedExhibition.startDate)} - {formatDate(selectedExhibition.endDate)}
                </span>
              </div>
            </div>
          </div>
          <Button>
            <FiEdit className="w-4 h-4" />
            Edit Exhibition
          </Button>
        </div>

        {/* ROI Stats */}
        {exhibitionROI && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Investment</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(exhibitionROI.totalInvestment)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
                    <FiDollarSign className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-success-600 mt-1">{formatCurrency(exhibitionROI.totalRevenue)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-success-50 flex items-center justify-center">
                    <FiTrendingUp className="w-6 h-6 text-success-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ROI</p>
                    <p className={`text-2xl font-bold mt-1 ${exhibitionROI.roiPercentage >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {exhibitionROI.roiPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${exhibitionROI.roiPercentage >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
                    <FiTarget className={`w-6 h-6 ${exhibitionROI.roiPercentage >= 0 ? 'text-success-600' : 'text-danger-600'}`} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{exhibitionROI.totalLeads}</p>
                    <p className="text-sm text-gray-500 mt-1">{exhibitionROI.convertedLeads} converted</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-info-50 flex items-center justify-center">
                    <FiUsers className="w-6 h-6 text-info-600" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Lead Funnel & Leads List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Funnel */}
          {leadFunnelData.length > 0 && (
            <Card>
              <CardHeader title="Lead Funnel" subtitle="Conversion pipeline" />
              <CardBody>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={leadFunnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#6B7280" />
                    <YAxis type="category" dataKey="name" stroke="#6B7280" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#7B2CBF" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}

          {/* Leads List */}
          <Card className="lg:col-span-2">
            <CardHeader 
              title="Exhibition Leads" 
              subtitle={`${exhibitionLeads.length} leads captured`}
              action={
                <Button size="sm">
                  <FiPlus className="w-4 h-4" />
                  Add Lead
                </Button>
              }
            />
            <CardBody>
              {exhibitionLeads.length === 0 ? (
                <EmptyState
                  title="No leads yet"
                  description="Start capturing leads from this exhibition"
                  actionLabel="Add First Lead"
                  onAction={() => console.log('Add lead')}
                />
              ) : (
                <div className="space-y-3">
                  {exhibitionLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                            <Badge variant={getInterestColor(lead.interestLevel)}>
                              {lead.interestLevel}
                            </Badge>
                            <Badge variant="neutral">{lead.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                            <div>{lead.email}</div>
                            <div>{lead.phone}</div>
                            {lead.company && <div className="col-span-2">Company: {lead.company}</div>}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-success-600 font-medium">
                              Est. Value: {formatCurrency(lead.estimatedValue || 0)}
                            </span>
                            {lead.interestedProducts && lead.interestedProducts.length > 0 && (
                              <span className="text-gray-500">
                                Interested: {lead.interestedProducts.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <FiEye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exhibition Management</h1>
          <p className="text-gray-600 mt-1">Track exhibitions, leads, and ROI</p>
        </div>
        <Button>
          <FiPlus className="w-4 h-4" />
          New Exhibition
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card hover className={selectedStatus === 'all' ? 'ring-2 ring-primary-500' : ''}>
          <CardBody>
            <button onClick={() => setSelectedStatus('all')} className="w-full text-left">
              <p className="text-sm font-medium text-gray-600">Total Exhibitions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </button>
          </CardBody>
        </Card>

        <Card hover className={selectedStatus === ExhibitionStatus.UPCOMING ? 'ring-2 ring-primary-500' : ''}>
          <CardBody>
            <button onClick={() => setSelectedStatus(ExhibitionStatus.UPCOMING)} className="w-full text-left">
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{stats.upcoming}</p>
            </button>
          </CardBody>
        </Card>

        <Card hover className={selectedStatus === ExhibitionStatus.ACTIVE ? 'ring-2 ring-primary-500' : ''}>
          <CardBody>
            <button onClick={() => setSelectedStatus(ExhibitionStatus.ACTIVE)} className="w-full text-left">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{stats.active}</p>
            </button>
          </CardBody>
        </Card>

        <Card hover className={selectedStatus === ExhibitionStatus.COMPLETED ? 'ring-2 ring-primary-500' : ''}>
          <CardBody>
            <button onClick={() => setSelectedStatus(ExhibitionStatus.COMPLETED)} className="w-full text-left">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-info-600 mt-1">{stats.completed}</p>
            </button>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalBudget)}</p>
          </CardBody>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
            <Button
              variant={viewMode === 'analytics' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('analytics')}
            >
              Analytics
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardBody>
            {filteredExhibitions.length === 0 ? (
              <EmptyState
                title="No exhibitions found"
                description="Create your first exhibition to get started"
                actionLabel="Create Exhibition"
                onAction={() => console.log('Create exhibition')}
              />
            ) : (
              <div className="space-y-4">
                {filteredExhibitions.map((exhibition) => {
                  const StatusIcon = getStatusIcon(exhibition.status);
                  const daysUntil = Math.ceil((new Date(exhibition.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div
                      key={exhibition.id}
                      className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => loadExhibitionDetails(exhibition)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">{exhibition.name}</h3>
                            <Badge variant={getStatusColor(exhibition.status)}>
                              <StatusIcon className="w-3 h-3" />
                              {exhibition.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <FiMapPin className="w-4 h-4 text-gray-400" />
                              <span>{exhibition.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiCalendar className="w-4 h-4 text-gray-400" />
                              <span>{formatDate(exhibition.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiDollarSign className="w-4 h-4 text-gray-400" />
                              <span>{formatCurrency(exhibition.budget)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiUsers className="w-4 h-4 text-gray-400" />
                              <span>{exhibition.actualFootfall || exhibition.expectedFootfall} visitors</span>
                            </div>
                          </div>

                          {exhibition.status === ExhibitionStatus.UPCOMING && daysUntil > 0 && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm">
                              <FiClock className="w-4 h-4" />
                              Starts in {daysUntil} days
                            </div>
                          )}

                          {exhibition.notes && (
                            <p className="text-sm text-gray-600 mt-3">{exhibition.notes}</p>
                          )}
                        </div>

                        <Button variant="outline" size="sm">
                          <FiEye className="w-4 h-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader title="Exhibition Performance" subtitle="Budget vs Footfall" />
            <CardBody>
              {roiData.length === 0 ? (
                <EmptyState
                  title="No completed exhibitions"
                  description="Analytics will appear after exhibitions are completed"
                />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={roiData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis yAxisId="left" stroke="#6B7280" />
                    <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="budget" fill="#7B2CBF" name="Budget (₹K)" radius={[8, 8, 0, 0]} />
                    <Bar yAxisId="right" dataKey="footfall" fill="#D4AF37" name="Footfall" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
