import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiCheck, FiCreditCard, FiGift, FiPlus, FiRefreshCw, FiTrash2, FiXCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import {
  superAdminService,
  type MockCheckoutResult,
  type PlanOrganizationSubscription,
  type PlanPayload,
  type SaasPlan,
  type ServiceFeatureKey,
} from '../services/api/superAdminService';
import { formatCurrency, formatDate } from '../utils/helpers';

type OfferEvent = {
  id: string;
  title: string;
  eventName: string;
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  startDate: string;
  endDate: string;
  planIds: string[];
  isActive: boolean;
};

type PlanForm = {
  name: string;
  code: string;
  description: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  price: string;
  currency: string;
  isActive: boolean;
  maxUsers: string;
  maxExhibitions: string;
  maxCustomers: string;
  maxInventoryItems: string;
  features: ServiceFeatureKey[];
};

type OfferForm = {
  title: string;
  eventName: string;
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: string;
  startDate: string;
  endDate: string;
  planIds: string[];
  isActive: boolean;
};

type CheckoutForm = {
  organizationId: string;
  planId: string;
  offerId: string;
  paymentMethod: 'CARD' | 'UPI' | 'BANK_TRANSFER';
  notes: string;
};

const SERVICE_CATALOG: Array<{ key: ServiceFeatureKey; name: string; useCase: string }> = [
  { key: 'CUSTOMER_MANAGEMENT', name: 'Customer Management', useCase: 'Customer profiles, spending history, retention workflows' },
  { key: 'INVENTORY_MANAGEMENT', name: 'Inventory Management', useCase: 'Stock tracking, reorder alerts, valuation control' },
  { key: 'FINANCE_MANAGEMENT', name: 'Finance', useCase: 'Invoices, ledger entries, profitability and cash-flow' },
  { key: 'TASK_MANAGEMENT', name: 'Task Management', useCase: 'Execution planning, assignment, deadlines, accountability' },
  { key: 'EXHIBITION_MANAGEMENT', name: 'Exhibition Management', useCase: 'Event planning, lead capture, ROI tracking' },
];

const OFFERS_KEY = 'plans_page_offer_events';

const initialPlanForm: PlanForm = {
  name: '',
  code: '',
  description: '',
  billingCycle: 'MONTHLY',
  price: '0',
  currency: 'INR',
  isActive: true,
  maxUsers: '25',
  maxExhibitions: '10',
  maxCustomers: '1000',
  maxInventoryItems: '2000',
  features: ['CUSTOMER_MANAGEMENT', 'INVENTORY_MANAGEMENT'],
};

const initialOfferForm: OfferForm = {
  title: '',
  eventName: '',
  code: '',
  type: 'PERCENTAGE',
  value: '10',
  startDate: '',
  endDate: '',
  planIds: [],
  isActive: true,
};

const initialCheckoutForm: CheckoutForm = {
  organizationId: '',
  planId: '',
  offerId: '',
  paymentMethod: 'CARD',
  notes: '',
};

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const uuid = () => Math.random().toString(36).slice(2, 10);

const loadOffers = (): OfferEvent[] => {
  try {
    const raw = localStorage.getItem(OFFERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveOffers = (offers: OfferEvent[]) => {
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
};

const normalizePayload = (form: PlanForm): PlanPayload => ({
  name: form.name.trim(),
  code: form.code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, ''),
  description: form.description.trim() || undefined,
  billingCycle: form.billingCycle,
  price: Math.max(0, toNumber(form.price)),
  currency: form.currency.trim().toUpperCase().slice(0, 3),
  isActive: form.isActive,
  features: form.features,
  limits: {
    maxUsers: Math.max(0, toNumber(form.maxUsers)),
    maxExhibitions: Math.max(0, toNumber(form.maxExhibitions)),
    maxCustomers: Math.max(0, toNumber(form.maxCustomers)),
    maxInventoryItems: Math.max(0, toNumber(form.maxInventoryItems)),
  },
});

const PlansPage = () => {
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [offers, setOffers] = useState<OfferEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [runningCheckout, setRunningCheckout] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanForm>(initialPlanForm);
  const [offerForm, setOfferForm] = useState<OfferForm>(initialOfferForm);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(initialCheckoutForm);
  const [checkoutResult, setCheckoutResult] = useState<MockCheckoutResult | null>(null);
  const [selectedPlanIdForOrgManager, setSelectedPlanIdForOrgManager] = useState('');
  const [planOrganizations, setPlanOrganizations] = useState<PlanOrganizationSubscription[]>([]);
  const [loadingPlanOrganizations, setLoadingPlanOrganizations] = useState(false);
  const [stoppingOrgId, setStoppingOrgId] = useState<string | null>(null);

  const activeOffers = useMemo(() => {
    const now = new Date();
    return offers.filter((offer) => {
      if (!offer.isActive) return false;
      const from = offer.startDate ? new Date(offer.startDate) : null;
      const to = offer.endDate ? new Date(offer.endDate) : null;
      return (!from || from <= now) && (!to || to >= now);
    });
  }, [offers]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === checkoutForm.planId) || null,
    [plans, checkoutForm.planId],
  );

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.id === checkoutForm.offerId) || null,
    [offers, checkoutForm.offerId],
  );

  const checkoutPreview = useMemo(() => {
    const baseAmount = selectedPlan?.price || 0;
    if (!selectedOffer) return { baseAmount, discountAmount: 0, finalAmount: baseAmount };

    const discountAmount = selectedOffer.type === 'PERCENTAGE'
      ? Math.min(baseAmount, (baseAmount * selectedOffer.value) / 100)
      : Math.min(baseAmount, selectedOffer.value);

    return {
      baseAmount,
      discountAmount,
      finalAmount: Math.max(0, baseAmount - discountAmount),
    };
  }, [selectedPlan, selectedOffer]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [planList, orgList] = await Promise.all([
        superAdminService.getPlans(false),
        superAdminService.getAllOrganizations(false),
      ]);
      setPlans(planList);
      setOrganizations(orgList.map((org) => ({ id: org.id, name: org.name })));
      setOffers(loadOffers());
      if (planList.length > 0) {
        setSelectedPlanIdForOrgManager((prev) => prev || planList[0].id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load plans data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!selectedPlanIdForOrgManager) {
      setPlanOrganizations([]);
      return;
    }

    const loadPlanOrganizations = async () => {
      setLoadingPlanOrganizations(true);
      try {
        const list = await superAdminService.getOrganizationsOnPlan(selectedPlanIdForOrgManager, false);
        setPlanOrganizations(list);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load organizations for selected plan');
      } finally {
        setLoadingPlanOrganizations(false);
      }
    };

    loadPlanOrganizations();
  }, [selectedPlanIdForOrgManager]);

  const setPlanField = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => {
    setPlanForm((prev) => ({ ...prev, [key]: value }));
  };

  const setOfferField = <K extends keyof OfferForm>(key: K, value: OfferForm[K]) => {
    setOfferForm((prev) => ({ ...prev, [key]: value }));
  };

  const setCheckoutField = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => {
    setCheckoutForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFeature = (feature: ServiceFeatureKey) => {
    setPlanForm((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((row) => row !== feature)
        : [...prev.features, feature],
    }));
  };

  const loadPlanIntoForm = (plan: SaasPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      billingCycle: plan.billingCycle,
      price: String(plan.price),
      currency: plan.currency,
      isActive: plan.isActive,
      maxUsers: String((plan.limits as any)?.maxUsers ?? 0),
      maxExhibitions: String((plan.limits as any)?.maxExhibitions ?? 0),
      maxCustomers: String((plan.limits as any)?.maxCustomers ?? 0),
      maxInventoryItems: String((plan.limits as any)?.maxInventoryItems ?? 0),
      features: plan.features,
    });
  };

  const resetPlanForm = () => {
    setEditingPlanId(null);
    setPlanForm(initialPlanForm);
  };

  const submitPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!planForm.name.trim() || !planForm.code.trim()) {
      toast.error('Plan name and code are required');
      return;
    }
    if (planForm.features.length === 0) {
      toast.error('Select at least one feature for the plan');
      return;
    }

    setSavingPlan(true);
    try {
      const payload = normalizePayload(planForm);
      if (!payload.code) {
        toast.error('Plan code contains only invalid characters');
        return;
      }
      if (editingPlanId) {
        const updated = await superAdminService.updatePlan(editingPlanId, payload);
        setPlans((prev) => prev.map((plan) => (plan.id === updated.id ? updated : plan)));
        toast.success('Plan updated');
      } else {
        const created = await superAdminService.createPlan(payload);
        setPlans((prev) => [created, ...prev]);
        toast.success('Plan created');
      }
      resetPlanForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const deactivatePlan = async (planId: string) => {
    try {
      const updated = await superAdminService.deactivatePlan(planId);
      setPlans((prev) => prev.map((plan) => (plan.id === updated.id ? updated : plan)));
      toast.success('Plan deactivated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate plan');
    }
  };

  const submitOffer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!offerForm.title.trim() || !offerForm.code.trim() || offerForm.planIds.length === 0) {
      toast.error('Offer title, code, and at least one plan are required');
      return;
    }

    setSavingOffer(true);
    try {
      const nextOffer: OfferEvent = {
        id: uuid(),
        title: offerForm.title.trim(),
        eventName: offerForm.eventName.trim() || 'Campaign',
        code: offerForm.code.trim().toUpperCase(),
        type: offerForm.type,
        value: toNumber(offerForm.value),
        startDate: offerForm.startDate,
        endDate: offerForm.endDate,
        planIds: offerForm.planIds,
        isActive: offerForm.isActive,
      };

      const nextOffers = [nextOffer, ...offers];
      setOffers(nextOffers);
      saveOffers(nextOffers);
      setOfferForm(initialOfferForm);
      toast.success('Offer event created');
    } finally {
      setSavingOffer(false);
    }
  };

  const removeOffer = (id: string) => {
    const next = offers.filter((offer) => offer.id !== id);
    setOffers(next);
    saveOffers(next);
  };

  const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!checkoutForm.organizationId || !checkoutForm.planId) {
      toast.error('Organization and plan are required for checkout');
      return;
    }

    const offer = selectedOffer
      ? {
          code: selectedOffer.code,
          title: `${selectedOffer.eventName}: ${selectedOffer.title}`,
          type: selectedOffer.type,
          value: selectedOffer.value,
        }
      : undefined;

    setRunningCheckout(true);
    try {
      const result = await superAdminService.runMockCheckout({
        organizationId: checkoutForm.organizationId,
        planId: checkoutForm.planId,
        paymentMethod: checkoutForm.paymentMethod,
        activateNow: true,
        offer,
        notes: checkoutForm.notes.trim() || undefined,
      });
      setCheckoutResult(result);
      toast.success('Mock payment successful and subscription activated');
      await refreshData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Mock checkout failed');
    } finally {
      setRunningCheckout(false);
    }
  };

  const stopOrganizationPlan = async (organizationId: string) => {
    setStoppingOrgId(organizationId);
    try {
      await superAdminService.cancelOrganizationCurrentSubscription(organizationId);
      toast.success('Organization subscription stopped');
      if (selectedPlanIdForOrgManager) {
        const list = await superAdminService.getOrganizationsOnPlan(selectedPlanIdForOrgManager, false);
        setPlanOrganizations(list);
      }
      await refreshData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to stop organization subscription');
    } finally {
      setStoppingOrgId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600 mt-1">Define service usage by tier, create event-based offers, and run mock payment checkout.</p>
        </div>
        <Button variant="outline" onClick={refreshData} leftIcon={<FiRefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader title={editingPlanId ? 'Edit Plan' : 'Create Plan'} subtitle="Configure pricing, service access, and usage limits" />
        <CardBody>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={submitPlan}>
            <Input label="Plan Name" value={planForm.name} onChange={(e) => setPlanField('name', e.target.value)} required />
            <Input label="Plan Code" value={planForm.code} onChange={(e) => setPlanField('code', e.target.value.toUpperCase())} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing Cycle</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={planForm.billingCycle} onChange={(e) => setPlanField('billingCycle', e.target.value as PlanForm['billingCycle'])}>
                <option value="MONTHLY">MONTHLY</option>
                <option value="QUARTERLY">QUARTERLY</option>
                <option value="YEARLY">YEARLY</option>
              </select>
            </div>
            <Input label="Price" type="number" value={planForm.price} onChange={(e) => setPlanField('price', e.target.value)} required />
            <Input label="Currency" value={planForm.currency} onChange={(e) => setPlanField('currency', e.target.value.toUpperCase())} required />
            <div className="flex items-center gap-2 mt-7">
              <input id="plan-active" type="checkbox" checked={planForm.isActive} onChange={(e) => setPlanField('isActive', e.target.checked)} />
              <label htmlFor="plan-active" className="text-sm text-gray-700">Plan active</label>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={2} value={planForm.description} onChange={(e) => setPlanField('description', e.target.value)} />
            </div>

            <Input label="Max Users" type="number" value={planForm.maxUsers} onChange={(e) => setPlanField('maxUsers', e.target.value)} />
            <Input label="Max Exhibitions" type="number" value={planForm.maxExhibitions} onChange={(e) => setPlanField('maxExhibitions', e.target.value)} />
            <Input label="Max Customers" type="number" value={planForm.maxCustomers} onChange={(e) => setPlanField('maxCustomers', e.target.value)} />
            <Input label="Max Inventory Items" type="number" value={planForm.maxInventoryItems} onChange={(e) => setPlanField('maxInventoryItems', e.target.value)} />

            <div className="md:col-span-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">Service Entitlements by Plan</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SERVICE_CATALOG.map((service) => (
                  <label key={service.key} className="border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                    <input type="checkbox" checked={planForm.features.includes(service.key)} onChange={() => toggleFeature(service.key)} />
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-600">{service.useCase}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              {editingPlanId && (
                <Button type="button" variant="outline" onClick={resetPlanForm}>Cancel Edit</Button>
              )}
              <Button type="submit" isLoading={savingPlan} leftIcon={<FiPlus className="w-4 h-4" />}>
                {editingPlanId ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Plans Catalog" subtitle={`${plans.length} total plans`} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Billing</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Services</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-gray-100 align-top">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{plan.name}</p>
                      <p className="text-xs text-gray-500">{plan.code}</p>
                      <p className="text-sm text-gray-700 mt-1">{formatCurrency(plan.price)} {plan.currency}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{plan.billingCycle}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {plan.features.map((feature) => (
                          <Badge key={`${plan.id}-${feature}`} variant="info" size="sm">{feature}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={plan.isActive ? 'success' : 'warning'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => loadPlanIntoForm(plan)}>Edit</Button>
                        {plan.isActive && (
                          <Button size="sm" variant="danger" onClick={() => deactivatePlan(plan.id)}>Deactivate</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Organizations On Selected Plan"
          subtitle="View all organizations currently using a plan and stop their plan if needed"
          action={
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={selectedPlanIdForOrgManager}
              onChange={(event) => setSelectedPlanIdForOrgManager(event.target.value)}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.code})
                </option>
              ))}
            </select>
          }
        />
        <CardBody>
          {loadingPlanOrganizations ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : planOrganizations.length === 0 ? (
            <p className="text-sm text-gray-500">No organizations are currently on this plan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Organization</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Start Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Seats</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {planOrganizations.map((row) => (
                    <tr key={row.subscriptionId} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{row.organization.name}</p>
                        <p className="text-xs text-gray-500">{row.organization.email || row.organization.slug}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'TRIALING' ? 'info' : 'warning'}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatDate(row.startDate)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{row.seats ?? '-'}</td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => stopOrganizationPlan(row.organizationId)}
                          isLoading={stoppingOrgId === row.organizationId}
                          leftIcon={<FiXCircle className="w-4 h-4" />}
                        >
                          Stop Plan
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Offers and Events" subtitle="Seasonal campaigns and promo rules (stored as local mock config)" />
          <CardBody>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submitOffer}>
              <Input label="Offer Title" value={offerForm.title} onChange={(e) => setOfferField('title', e.target.value)} required />
              <Input label="Event Name" value={offerForm.eventName} onChange={(e) => setOfferField('eventName', e.target.value)} leftIcon={<FiCalendar className="w-4 h-4" />} />
              <Input label="Offer Code" value={offerForm.code} onChange={(e) => setOfferField('code', e.target.value.toUpperCase())} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Type</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={offerForm.type} onChange={(e) => setOfferField('type', e.target.value as OfferForm['type'])}>
                  <option value="PERCENTAGE">PERCENTAGE</option>
                  <option value="FLAT">FLAT</option>
                </select>
              </div>
              <Input label="Discount Value" type="number" value={offerForm.value} onChange={(e) => setOfferField('value', e.target.value)} />
              <Input label="Start Date" type="date" value={offerForm.startDate} onChange={(e) => setOfferField('startDate', e.target.value)} />
              <Input label="End Date" type="date" value={offerForm.endDate} onChange={(e) => setOfferField('endDate', e.target.value)} />

              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-1.5">Applicable Plans</p>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((plan) => (
                    <label key={plan.id} className="text-sm border border-gray-200 rounded px-2 py-1 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={offerForm.planIds.includes(plan.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...offerForm.planIds, plan.id]
                            : offerForm.planIds.filter((row) => row !== plan.id);
                          setOfferField('planIds', next);
                        }}
                      />
                      <span>{plan.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={offerForm.isActive} onChange={(e) => setOfferField('isActive', e.target.checked)} />
                  Active offer
                </label>
                <Button type="submit" isLoading={savingOffer} leftIcon={<FiGift className="w-4 h-4" />}>Add Offer</Button>
              </div>
            </form>

            <div className="mt-4 space-y-2">
              {offers.length === 0 ? (
                <p className="text-sm text-gray-500">No offers configured yet.</p>
              ) : (
                offers.map((offer) => (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-3 flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{offer.title}</p>
                      <p className="text-xs text-gray-600">{offer.eventName} • {offer.code} • {offer.type} {offer.value}</p>
                      <p className="text-xs text-gray-500">{offer.startDate ? formatDate(offer.startDate) : 'No start'} - {offer.endDate ? formatDate(offer.endDate) : 'No end'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={activeOffers.some((row) => row.id === offer.id) ? 'success' : 'warning'}>{activeOffers.some((row) => row.id === offer.id) ? 'Active' : 'Inactive'}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => removeOffer(offer.id)} leftIcon={<FiTrash2 className="w-4 h-4" />}>Remove</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Mock Payment Checkout" subtitle="Simulate plan purchase and activate organization subscription" />
          <CardBody>
            <form className="grid grid-cols-1 gap-3" onSubmit={submitCheckout}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={checkoutForm.organizationId} onChange={(e) => setCheckoutField('organizationId', e.target.value)} required>
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={checkoutForm.planId} onChange={(e) => setCheckoutField('planId', e.target.value)} required>
                  <option value="">Select plan</option>
                  {plans.filter((plan) => plan.isActive).map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} ({formatCurrency(plan.price)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Offer</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={checkoutForm.offerId} onChange={(e) => setCheckoutField('offerId', e.target.value)}>
                  <option value="">No offer</option>
                  {activeOffers
                    .filter((offer) => !checkoutForm.planId || offer.planIds.includes(checkoutForm.planId))
                    .map((offer) => (
                      <option key={offer.id} value={offer.id}>{offer.code} ({offer.type} {offer.value})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={checkoutForm.paymentMethod} onChange={(e) => setCheckoutField('paymentMethod', e.target.value as CheckoutForm['paymentMethod'])}>
                  <option value="CARD">CARD</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                </select>
              </div>

              <Input label="Notes" value={checkoutForm.notes} onChange={(e) => setCheckoutField('notes', e.target.value)} />

              <div className="rounded-lg border border-dashed border-gray-300 p-3 text-sm">
                <p className="font-semibold text-gray-900 mb-1">Checkout Preview</p>
                <p className="text-gray-700">Base: {formatCurrency(checkoutPreview.baseAmount)}</p>
                <p className="text-gray-700">Discount: {formatCurrency(checkoutPreview.discountAmount)}</p>
                <p className="text-gray-900 font-bold">Final: {formatCurrency(checkoutPreview.finalAmount)}</p>
              </div>

              <Button type="submit" isLoading={runningCheckout} leftIcon={<FiCreditCard className="w-4 h-4" />}>
                Run Mock Payment
              </Button>
            </form>

            {checkoutResult && (
              <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="font-semibold text-green-800 flex items-center gap-2"><FiCheck className="w-4 h-4" /> {checkoutResult.message}</p>
                <p className="text-sm text-green-700 mt-1">Transaction: {checkoutResult.transactionId}</p>
                <p className="text-sm text-green-700">Final Charged: {formatCurrency(checkoutResult.invoice.finalAmount)} {checkoutResult.invoice.currency}</p>
                <p className="text-sm text-green-700">Processed: {formatDate(checkoutResult.processedAt)}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default PlansPage;
