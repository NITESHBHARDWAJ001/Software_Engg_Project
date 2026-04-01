import { useEffect, useState } from 'react';
import { FiBriefcase, FiMail, FiPhone, FiUser, FiLock, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'sonner';
import { Button, Input } from '../components/ui';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { superAdminService } from '../services/api/superAdminService';
import type { Organization } from '../types';
import { formatDate } from '../utils/helpers';

type CreateFormState = {
  name: string;
  email: string;
  phone: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

const initialFormState: CreateFormState = {
  name: '',
  email: '',
  phone: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
};

const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateFormState>(initialFormState);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const data = await superAdminService.getAllOrganizations();
      setOrganizations(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const setField = (field: keyof CreateFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateOrganization = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name || !form.adminName || !form.adminEmail || !form.adminPassword) {
      toast.error('Please provide organization name and admin credentials');
      return;
    }

    setCreating(true);
    try {
      const created = await superAdminService.createOrganization({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      });

      setOrganizations((prev) => [created.organization, ...prev]);
      setForm(initialFormState);
      toast.success(`Organization ${created.organization.name} created successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
        <p className="text-gray-600 mt-1">Create and manage organizations from one place</p>
      </div>

      <Card>
        <CardHeader title="Create Organization" subtitle="Provision a new organization and its admin user" />
        <CardBody>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateOrganization}>
            <Input
              label="Organization Name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              leftIcon={<FiBriefcase className="w-4 h-4" />}
              required
            />
            <Input
              label="Organization Email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              leftIcon={<FiMail className="w-4 h-4" />}
            />
            <Input
              label="Organization Phone"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              leftIcon={<FiPhone className="w-4 h-4" />}
            />
            <div />
            <Input
              label="Admin Name"
              value={form.adminName}
              onChange={(e) => setField('adminName', e.target.value)}
              leftIcon={<FiUser className="w-4 h-4" />}
              required
            />
            <Input
              label="Admin Email"
              type="email"
              value={form.adminEmail}
              onChange={(e) => setField('adminEmail', e.target.value)}
              leftIcon={<FiMail className="w-4 h-4" />}
              required
            />
            <Input
              label="Admin Password"
              type="password"
              value={form.adminPassword}
              onChange={(e) => setField('adminPassword', e.target.value)}
              leftIcon={<FiLock className="w-4 h-4" />}
              helperText="At least 8 characters"
              required
            />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" isLoading={creating} leftIcon={<FiPlus className="w-4 h-4" />}>
                Create Organization
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="All Organizations"
          subtitle={`Total ${organizations.length} organizations`}
          action={
            <Button variant="outline" size="sm" onClick={loadOrganizations} leftIcon={<FiRefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
          }
        />
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No organizations found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Users</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{org.name}</td>
                      <td className="py-3 px-4 text-gray-600">{org.contactEmail || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">{org.phone || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">{org.totalUsers}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(org.createdAt)}</td>
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
};

export default OrganizationsPage;
