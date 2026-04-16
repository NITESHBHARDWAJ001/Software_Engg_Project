import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiBriefcase,
  FiUsers,
  FiCreditCard,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiSave,
  FiCheckCircle,
  FiClock,
  FiShield,
} from 'react-icons/fi';
import { useAuthStore } from '../../../store/authStore';
import { useOrganizationStore } from '../../../store/organizationStore';
import { downloadFile, formatCurrency, formatDate } from '../../../utils/helpers';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { UserRole } from '../../../types';
import { superAdminService, type SaasPlan } from '../../../services/api/superAdminService';
import { authService } from '../../../services/api/authService';
import { toast } from 'sonner';
import { ROUTES } from '../../../utils/constants';

type SettingsTab = 'profile' | 'organization' | 'users' | 'subscription';

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { currentOrganization, setCurrentOrganization } = useOrganizationStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);

  // Mock team members
  const teamMembers = [
    {
      id: 'user-1',
      name: 'Admin User',
      email: 'admin@store1.com',
      role: UserRole.ORG_ADMIN,
      status: 'Active',
      joinedAt: new Date('2025-01-15').toISOString(),
    },
    {
      id: 'user-2',
      name: 'Manager User',
      email: 'manager@store1.com',
      role: UserRole.MANAGER,
      status: 'Active',
      joinedAt: new Date('2025-02-01').toISOString(),
    },
    {
      id: 'user-3',
      name: 'Staff User',
      email: 'staff@store1.com',
      role: UserRole.STAFF,
      status: 'Active',
      joinedAt: new Date('2025-02-20').toISOString(),
    },
  ];

  const getRoleBadgeVariant = (role: UserRole): 'primary' | 'info' | 'warning' | 'success' => {
    switch (role) {
      case UserRole.ORG_ADMIN:
        return 'primary';
      case UserRole.MANAGER:
        return 'info';
      case UserRole.STAFF:
        return 'warning';
      default:
        return 'success';
    }
  };

  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      try {
        const availablePlans = await superAdminService.getPlans(true);
        setPlans(availablePlans);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load subscription plans');
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, []);

  useEffect(() => {
    if (location.pathname.endsWith('/subscription')) {
      setActiveTab('subscription');
      return;
    }
    if (location.pathname.endsWith('/organization')) {
      setActiveTab('organization');
      return;
    }
    if (location.pathname.endsWith('/users')) {
      setActiveTab('users');
      return;
    }
    setActiveTab('profile');
  }, [location.pathname]);

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (tab === 'profile') {
      navigate(ROUTES.SETTINGS);
      return;
    }
    if (tab === 'organization') {
      navigate(ROUTES.SETTINGS_ORGANIZATION);
      return;
    }
    if (tab === 'users') {
      navigate(ROUTES.SETTINGS_USERS);
      return;
    }
    navigate(ROUTES.SETTINGS_SUBSCRIPTION);
  };

  const getCurrentPlanPrice = () => {
    if (!currentOrganization) return 0;
    const match = plans.find(
      (plan) =>
        plan.code.toUpperCase() === currentOrganization.subscriptionPlan ||
        plan.name.toUpperCase() === currentOrganization.subscriptionPlan,
    );
    return match?.price ?? 0;
  };

  const runUpgrade = async (plan: SaasPlan) => {
    if (!currentOrganization || !user) return;
    if (user.role !== UserRole.ORG_ADMIN) {
      toast.error('Only organization admins can upgrade plans');
      return;
    }

    setUpgradingPlanId(plan.id);
    try {
      await superAdminService.runMockCheckout({
        organizationId: currentOrganization.id,
        planId: plan.id,
        paymentMethod: 'CARD',
        activateNow: true,
        notes: 'Organization dashboard self-service upgrade',
      });

      const refreshedOrganization = await authService.getCurrentOrganization();
      if (refreshedOrganization) {
        setCurrentOrganization(refreshedOrganization);
      }

      toast.success(`Plan upgraded to ${plan.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Plan upgrade failed');
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const csvEscape = (value: string | number) => {
    const text = String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const billingHistory = [0, 1, 2].map((offset) => {
    const date = new Date();
    date.setMonth(date.getMonth() - offset);

    return {
      date: date.toISOString().slice(0, 10),
      amount: getCurrentPlanPrice(),
      status: 'Paid',
      planCode: currentOrganization?.subscriptionPlan || 'PLAN',
    };
  });

  const downloadBillingReceipt = (bill: { date: string; amount: number; status: string; planCode: string }) => {
    const rows = [
      ['Organization', currentOrganization?.name || ''],
      ['Plan', bill.planCode],
      ['Billing Date', bill.date],
      ['Amount', String(bill.amount)],
      ['Status', bill.status],
    ];

    const csv = rows.map((row) => row.map((value) => csvEscape(value)).join(',')).join('\n');
    const safePlanCode = bill.planCode.replace(/[^A-Z0-9_-]/gi, '_').toUpperCase();
    downloadFile(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      `subscription-${safePlanCode}-${bill.date}.csv`,
    );
    toast.success(`Downloaded subscription receipt for ${formatDate(new Date(bill.date))}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and organization settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => selectTab('profile')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'profile'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiUser className="inline w-4 h-4 mr-2" />
          Profile
        </button>
        <button
          onClick={() => selectTab('organization')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'organization'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiBriefcase className="inline w-4 h-4 mr-2" />
          Organization
        </button>
        <button
          onClick={() => selectTab('users')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'users'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiUsers className="inline w-4 h-4 mr-2" />
          Team Members
        </button>
        <button
          onClick={() => selectTab('subscription')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'subscription'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiCreditCard className="inline w-4 h-4 mr-2" />
          Subscription
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Personal Information" />
            <CardContent className="p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    defaultValue={user?.name}
                    placeholder="Enter your full name"
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    defaultValue={user?.email}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+91 98765 43210"
                    leftIcon={<FiPhone />}
                  />
                  <Input label="Job Title" placeholder="e.g., Store Manager" />
                </div>

                <Input
                  label="Location"
                  placeholder="City, State"
                  leftIcon={<FiMapPin />}
                />

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="primary">
                    <FiSave className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Account Status" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <Badge variant={getRoleBadgeVariant(user?.role || UserRole.STAFF)}>
                    {user?.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant="success">
                    <FiCheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
                {user?.lastLogin && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-600 mb-1">Last Login</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(new Date(user.lastLogin))}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Security" />
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiShield className="w-4 h-4 text-success" />
                      <span className="text-sm text-gray-700">Two-Factor Auth</span>
                    </div>
                    <Badge variant="success">Enabled</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage Security
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Organization Tab */}
      {activeTab === 'organization' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Organization Details" />
            <CardContent className="p-6">
              <form className="space-y-6">
                <Input
                  label="Organization Name"
                  defaultValue={currentOrganization?.name}
                  placeholder="Enter organization name"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Contact Email"
                    type="email"
                    defaultValue={currentOrganization?.contactEmail}
                    placeholder="contact@example.com"
                    leftIcon={<FiMail />}
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    defaultValue={currentOrganization?.contactPhone}
                    placeholder="+91 98765 43210"
                    leftIcon={<FiPhone />}
                  />
                </div>

                <Input
                  label="Address"
                  defaultValue={currentOrganization?.address}
                  placeholder="Enter business address"
                  leftIcon={<FiMapPin />}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="City"
                    defaultValue={currentOrganization?.city}
                    placeholder="City"
                  />
                  <Input
                    label="State"
                    defaultValue={currentOrganization?.state}
                    placeholder="State"
                  />
                  <Input
                    label="Pincode"
                    defaultValue={currentOrganization?.pincode}
                    placeholder="Pincode"
                  />
                </div>

                <Input
                  label="Website"
                  type="url"
                  placeholder="https://example.com"
                  leftIcon={<FiGlobe />}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Describe your business..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="primary">
                    <FiSave className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Organization Info" />
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Organization ID</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {currentOrganization?.id}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {currentOrganization?.createdAt &&
                      formatDate(new Date(currentOrganization.createdAt))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Current Plan</p>
                  <Badge variant="primary">{currentOrganization?.subscriptionPlan}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Logo" />
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <FiBriefcase className="w-12 h-12 text-gray-400" />
                  </div>
                  <Button variant="outline" size="sm">
                    Upload Logo
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Team Members Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader
            title="Team Members"
            action={
              <Button variant="primary" size="sm">
                <FiUsers className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            }
          />
          <CardContent className="p-6">
            <div className="space-y-4">
              {teamMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <FiUser className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined {formatDate(new Date(member.joinedAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                    <Badge variant="success">{member.status}</Badge>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader title="Current Plan" />
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {currentOrganization?.subscriptionPlan}
                    </h3>
                    <Badge variant="success">
                      <FiCheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4">Perfect for growing businesses</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FiUsers className="w-4 h-4" />
                      <span>
                        {currentOrganization?.currentUsers} / {currentOrganization?.maxUsers}{' '}
                        users
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4" />
                      <span>
                        Renews on{' '}
                        {currentOrganization?.subscriptionEndDate &&
                          formatDate(new Date(currentOrganization.subscriptionEndDate))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{formatCurrency(getCurrentPlanPrice())}</p>
                  <p className="text-sm text-gray-600">/month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card>
            <CardHeader title="Plan Features" />
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentOrganization?.features && (
                  <>
                    <div className="flex items-center gap-3">
                      <FiCheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-gray-700">Up to {currentOrganization.features.maxUsers} users</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiCheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-gray-700">Up to {currentOrganization.features.maxExhibitions} exhibitions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiCheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-gray-700">Up to {currentOrganization.features.maxCustomers} customers</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiCheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-gray-700">Up to {currentOrganization.features.maxInventoryItems} inventory items</span>
                    </div>
                    {currentOrganization.features.analyticsAccess && (
                      <div className="flex items-center gap-3">
                        <FiCheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-gray-700">Analytics Access</span>
                      </div>
                    )}
                    {currentOrganization.features.exportData && (
                      <div className="flex items-center gap-3">
                        <FiCheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-gray-700">Data Export</span>
                      </div>
                    )}
                    {currentOrganization.features.customBranding && (
                      <div className="flex items-center gap-3">
                        <FiCheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-gray-700">Custom Branding</span>
                      </div>
                    )}
                    {currentOrganization.features.apiAccess && (
                      <div className="flex items-center gap-3">
                        <FiCheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-gray-700">API Access</span>
                      </div>
                    )}
                    {currentOrganization.features.prioritySupport && (
                      <div className="flex items-center gap-3">
                        <FiCheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-gray-700">Priority Support</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Options */}
          <Card>
            <CardHeader title="Upgrade Your Plan" />
            <CardContent className="p-6">
              {plansLoading ? (
                <p className="text-sm text-gray-600">Loading plans...</p>
              ) : plans.length === 0 ? (
                <p className="text-sm text-gray-600">No active plans available for upgrade.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const isCurrent =
                      currentOrganization?.subscriptionPlan === plan.code.toUpperCase() ||
                      currentOrganization?.subscriptionPlan === plan.name.toUpperCase();
                    const canUpgrade = user?.role === UserRole.ORG_ADMIN;

                    return (
                      <div
                        key={plan.id}
                        className={`p-6 border-2 rounded-lg transition-colors ${
                          isCurrent ? 'border-primary shadow-md' : 'border-gray-200 hover:border-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                          {isCurrent && <Badge variant="primary">Current</Badge>}
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(plan.price, plan.currency)}</p>
                        <p className="text-sm text-gray-600 mb-4">/{plan.billingCycle.toLowerCase()}</p>
                        <Button
                          variant={isCurrent ? 'outline' : 'primary'}
                          size="sm"
                          className="w-full"
                          disabled={isCurrent || !canUpgrade || upgradingPlanId === plan.id}
                          onClick={() => {
                            if (!isCurrent && canUpgrade) {
                              void runUpgrade(plan);
                            }
                          }}
                        >
                          {isCurrent
                            ? 'Current Plan'
                            : !canUpgrade
                            ? 'Org Admin Only'
                            : upgradingPlanId === plan.id
                            ? 'Upgrading...'
                            : 'Upgrade Now'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader title="Billing History" />
            <CardContent className="p-6">
              <div className="space-y-3">
                {billingHistory.map((bill, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(new Date(bill.date))}
                      </p>
                      <p className="text-sm text-gray-600">Monthly Subscription</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-gray-900">{formatCurrency(bill.amount)}</p>
                      <Badge variant="success">{bill.status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => downloadBillingReceipt(bill)}>
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
