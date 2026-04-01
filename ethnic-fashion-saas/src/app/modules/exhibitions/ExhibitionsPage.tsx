import { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiMapPin, FiPlus, FiUsers } from 'react-icons/fi';
import { toast } from 'sonner';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { exhibitionService } from '../../../services/api/exhibitionService';
import { type Exhibition, type ExhibitionLead, ExhibitionStatus, LeadInterestLevel, LeadStatus } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/helpers';

type ExhibitionForm = {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  budget: string;
  expectedRevenue: string;
  expectedFootfall: string;
};

type LeadForm = {
  name: string;
  phone: string;
  email: string;
  company: string;
  interestLevel: LeadInterestLevel;
  estimatedValue: string;
  notes: string;
};

const initialExhibitionForm: ExhibitionForm = {
  name: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  budget: '0',
  expectedRevenue: '0',
  expectedFootfall: '',
};

const initialLeadForm: LeadForm = {
  name: '',
  phone: '',
  email: '',
  company: '',
  interestLevel: LeadInterestLevel.COLD,
  estimatedValue: '0',
  notes: '',
};

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function ExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [leads, setLeads] = useState<ExhibitionLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ExhibitionStatus | 'all'>('all');

  const [showExhibitionForm, setShowExhibitionForm] = useState(false);
  const [exhibitionForm, setExhibitionForm] = useState<ExhibitionForm>(initialExhibitionForm);

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadForm>(initialLeadForm);

  const loadExhibitions = async () => {
    setLoading(true);
    try {
      const data = await exhibitionService.getAllExhibitions('');
      setExhibitions(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExhibitions();
  }, []);

  const openExhibition = async (exhibition: Exhibition) => {
    setSelectedExhibition(exhibition);
    try {
      const list = await exhibitionService.getExhibitionLeads(exhibition.id);
      setLeads(list);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load leads');
    }
  };

  const stats = useMemo(() => {
    const total = exhibitions.length;
    const upcoming = exhibitions.filter((item) => item.status === ExhibitionStatus.UPCOMING).length;
    const active = exhibitions.filter((item) => item.status === ExhibitionStatus.ACTIVE).length;
    const completed = exhibitions.filter((item) => item.status === ExhibitionStatus.COMPLETED).length;
    const totalBudget = exhibitions.reduce((sum, item) => sum + item.budget, 0);
    return { total, upcoming, active, completed, totalBudget };
  }, [exhibitions]);

  const filteredExhibitions = useMemo(() => {
    if (filterStatus === 'all') return exhibitions;
    return exhibitions.filter((item) => item.status === filterStatus);
  }, [exhibitions, filterStatus]);

  const setExhField = (field: keyof ExhibitionForm, value: string) => {
    setExhibitionForm((prev) => ({ ...prev, [field]: value }));
  };

  const setLeadField = (field: keyof LeadForm, value: string) => {
    setLeadForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitExhibition = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!exhibitionForm.name.trim() || !exhibitionForm.location.trim() || !exhibitionForm.startDate || !exhibitionForm.endDate) {
      toast.error('Name, location, and dates are required');
      return;
    }

    setSaving(true);
    try {
      const created = await exhibitionService.createExhibition({
        organizationId: '',
        name: exhibitionForm.name.trim(),
        description: exhibitionForm.description.trim(),
        location: exhibitionForm.location.trim(),
        startDate: exhibitionForm.startDate,
        endDate: exhibitionForm.endDate,
        status: ExhibitionStatus.UPCOMING,
        budget: toNumber(exhibitionForm.budget),
        actualSpent: 0,
        expectedRevenue: toNumber(exhibitionForm.expectedRevenue),
        actualRevenue: 0,
        expectedFootfall: exhibitionForm.expectedFootfall ? toNumber(exhibitionForm.expectedFootfall) : undefined,
        actualFootfall: undefined,
        boothSize: undefined,
        stallNumber: undefined,
        category: undefined,
        assignedStaff: [],
        assignedStaffNames: [],
        totalLeads: 0,
        convertedLeads: 0,
        createdBy: '',
        images: [],
        notes: undefined,
      });
      setExhibitions((prev) => [created, ...prev]);
      setShowExhibitionForm(false);
      setExhibitionForm(initialExhibitionForm);
      toast.success('Exhibition created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create exhibition');
    } finally {
      setSaving(false);
    }
  };

  const submitLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedExhibition) return;
    if (!leadForm.name.trim() || !leadForm.phone.trim()) {
      toast.error('Lead name and phone are required');
      return;
    }

    setSaving(true);
    try {
      const created = await exhibitionService.createLead({
        exhibitionId: selectedExhibition.id,
        organizationId: selectedExhibition.organizationId,
        name: leadForm.name.trim(),
        phone: leadForm.phone.trim(),
        email: leadForm.email.trim() || undefined,
        company: leadForm.company.trim() || undefined,
        interestLevel: leadForm.interestLevel,
        status: LeadStatus.NEW,
        interestedProducts: [],
        notes: leadForm.notes.trim() || undefined,
        capturedBy: '',
        capturedByName: '',
        capturedAt: new Date().toISOString(),
        followUpDate: undefined,
        lastContactedDate: undefined,
        source: 'EXHIBITION',
        estimatedValue: toNumber(leadForm.estimatedValue),
        interactions: [],
      });

      setLeads((prev) => [created, ...prev]);
      setLeadForm(initialLeadForm);
      setShowLeadForm(false);
      toast.success('Lead added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add lead');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (selectedExhibition) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" size="sm" onClick={() => setSelectedExhibition(null)}>Back</Button>
            <h1 className="text-3xl font-bold text-gray-900 mt-3">{selectedExhibition.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1"><FiMapPin className="w-4 h-4" />{selectedExhibition.location}</span>
              <span className="flex items-center gap-1"><FiCalendar className="w-4 h-4" />{formatDate(selectedExhibition.startDate)} - {formatDate(selectedExhibition.endDate)}</span>
            </div>
          </div>
          <Button onClick={() => setShowLeadForm((prev) => !prev)}>
            <FiPlus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardBody><div className="text-sm text-gray-600">Status</div><div className="text-xl font-bold"><Badge variant="info">{selectedExhibition.status}</Badge></div></CardBody></Card>
          <Card><CardBody><div className="text-sm text-gray-600">Budget</div><div className="text-xl font-bold">{formatCurrency(selectedExhibition.budget)}</div></CardBody></Card>
          <Card><CardBody><div className="text-sm text-gray-600">Expected Revenue</div><div className="text-xl font-bold">{formatCurrency(selectedExhibition.expectedRevenue)}</div></CardBody></Card>
          <Card><CardBody><div className="text-sm text-gray-600">Leads</div><div className="text-xl font-bold flex items-center gap-2"><FiUsers />{leads.length}</div></CardBody></Card>
        </div>

        {showLeadForm && (
          <Card>
            <CardHeader title="Add Exhibition Lead" />
            <CardBody>
              <form onSubmit={submitLead} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Name" value={leadForm.name} onChange={(e) => setLeadField('name', e.target.value)} required />
                <Input label="Phone" value={leadForm.phone} onChange={(e) => setLeadField('phone', e.target.value)} required />
                <Input label="Email" value={leadForm.email} onChange={(e) => setLeadField('email', e.target.value)} />
                <Input label="Company" value={leadForm.company} onChange={(e) => setLeadField('company', e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Level</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={leadForm.interestLevel}
                    onChange={(e) => setLeadField('interestLevel', e.target.value as LeadInterestLevel)}
                  >
                    <option value={LeadInterestLevel.COLD}>COLD</option>
                    <option value={LeadInterestLevel.WARM}>WARM</option>
                    <option value={LeadInterestLevel.HOT}>HOT</option>
                  </select>
                </div>
                <Input label="Estimated Value" type="number" value={leadForm.estimatedValue} onChange={(e) => setLeadField('estimatedValue', e.target.value)} />
                <div className="md:col-span-3">
                  <Input label="Notes" value={leadForm.notes} onChange={(e) => setLeadField('notes', e.target.value)} />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowLeadForm(false)}>Cancel</Button>
                  <Button type="submit" isLoading={saving}>Save Lead</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Captured Leads" subtitle={`${leads.length} total`} />
          <CardBody>
            {leads.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No leads captured yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lead</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Interest</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Est. Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{lead.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{lead.phone}{lead.email ? ` / ${lead.email}` : ''}</td>
                        <td className="py-3 px-4"><Badge variant={lead.interestLevel === LeadInterestLevel.HOT ? 'danger' : lead.interestLevel === LeadInterestLevel.WARM ? 'warning' : 'info'}>{lead.interestLevel}</Badge></td>
                        <td className="py-3 px-4"><Badge variant="neutral">{lead.status}</Badge></td>
                        <td className="py-3 px-4 text-sm text-gray-700">{formatCurrency(lead.estimatedValue || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exhibition Management</h1>
          <p className="text-gray-600 mt-1">Manage exhibitions and leads with live backend data</p>
        </div>
        <Button onClick={() => setShowExhibitionForm((prev) => !prev)}>
          <FiPlus className="w-4 h-4" />
          New Exhibition
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardBody><div className="text-sm text-gray-600">Total</div><div className="text-2xl font-bold">{stats.total}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-gray-600">Upcoming</div><div className="text-2xl font-bold text-primary-600">{stats.upcoming}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-gray-600">Active</div><div className="text-2xl font-bold text-success-600">{stats.active}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-gray-600">Completed</div><div className="text-2xl font-bold text-info-600">{stats.completed}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-gray-600">Budget</div><div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div></CardBody></Card>
      </div>

      {showExhibitionForm && (
        <Card>
          <CardHeader title="Create Exhibition" />
          <CardBody>
            <form onSubmit={submitExhibition} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Name" value={exhibitionForm.name} onChange={(e) => setExhField('name', e.target.value)} required />
              <Input label="Location" value={exhibitionForm.location} onChange={(e) => setExhField('location', e.target.value)} required />
              <Input label="Description" value={exhibitionForm.description} onChange={(e) => setExhField('description', e.target.value)} />
              <Input label="Start Date" type="date" value={exhibitionForm.startDate} onChange={(e) => setExhField('startDate', e.target.value)} required />
              <Input label="End Date" type="date" value={exhibitionForm.endDate} onChange={(e) => setExhField('endDate', e.target.value)} required />
              <Input label="Budget" type="number" value={exhibitionForm.budget} onChange={(e) => setExhField('budget', e.target.value)} />
              <Input label="Expected Revenue" type="number" value={exhibitionForm.expectedRevenue} onChange={(e) => setExhField('expectedRevenue', e.target.value)} />
              <Input label="Expected Footfall" type="number" value={exhibitionForm.expectedFootfall} onChange={(e) => setExhField('expectedFootfall', e.target.value)} />
              <div className="md:col-span-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowExhibitionForm(false)}>Cancel</Button>
                <Button type="submit" isLoading={saving}>Create Exhibition</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Exhibitions"
          action={
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ExhibitionStatus | 'all')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value={ExhibitionStatus.UPCOMING}>Upcoming</option>
              <option value={ExhibitionStatus.ACTIVE}>Active</option>
              <option value={ExhibitionStatus.COMPLETED}>Completed</option>
              <option value={ExhibitionStatus.CANCELLED}>Cancelled</option>
            </select>
          }
        />
        <CardBody>
          {filteredExhibitions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No exhibitions available</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredExhibitions.map((exhibition) => (
                <button
                  key={exhibition.id}
                  className="w-full text-left border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  onClick={() => openExhibition(exhibition)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{exhibition.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1"><FiMapPin className="w-4 h-4" />{exhibition.location}</p>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><FiCalendar className="w-4 h-4" />{formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}</p>
                    </div>
                    <Badge variant={exhibition.status === ExhibitionStatus.ACTIVE ? 'success' : exhibition.status === ExhibitionStatus.UPCOMING ? 'info' : exhibition.status === ExhibitionStatus.COMPLETED ? 'neutral' : 'danger'}>
                      {exhibition.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div className="text-gray-600">Budget: <span className="text-gray-900 font-medium">{formatCurrency(exhibition.budget)}</span></div>
                    <div className="text-gray-600">Leads: <span className="text-gray-900 font-medium">{exhibition.totalLeads}</span></div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
