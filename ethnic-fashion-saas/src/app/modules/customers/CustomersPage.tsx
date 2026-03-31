import { useEffect, useMemo, useState } from 'react';
import { FiDollarSign, FiEdit2, FiPlus, FiSearch, FiTrash2, FiUserCheck, FiUserX, FiUsers } from 'react-icons/fi';
import { toast } from 'sonner';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { customerApiService, type CustomerRecord, type CustomerStats } from '../../../services/api/customerService';
import { formatCurrency, formatDate } from '../../../utils/helpers';

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
};

const initialForm: CustomerForm = {
  name: '',
  email: '',
  phone: '',
  city: '',
  country: '',
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(initialForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, statsData] = await Promise.all([
        customerApiService.list(),
        customerApiService.stats(),
      ]);
      setCustomers(list);
      setStats(statsData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.city, customer.country]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [customers, search]);

  const setField = (field: keyof CustomerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const startEdit = (customer: CustomerRecord) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      city: customer.city || '',
      country: customer.country || '',
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
      };

      if (editingId) {
        const updated = await customerApiService.update(editingId, payload);
        setCustomers((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
        toast.success('Customer updated');
      } else {
        const created = await customerApiService.create(payload);
        setCustomers((prev) => [created, ...prev]);
        toast.success('Customer created');
      }

      cancelForm();
      setStats(await customerApiService.stats());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const archiveCustomer = async (customerId: string) => {
    try {
      await customerApiService.archive(customerId);
      setCustomers((prev) => prev.filter((row) => row.id !== customerId));
      setStats(await customerApiService.stats());
      toast.success('Customer archived');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to archive customer');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage customer records and relationships</p>
        </div>
        <Button onClick={startCreate}>
          <FiPlus className="w-4 h-4" />
          New Customer
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardBody><div className="text-sm text-gray-600">Total</div><div className="text-2xl font-bold">{stats?.totalCustomers ?? 0}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-gray-600">Active</div><div className="text-2xl font-bold text-success-600 flex items-center gap-2"><FiUserCheck />{stats?.activeCustomers ?? 0}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-gray-600">Inactive</div><div className="text-2xl font-bold text-warning-600 flex items-center gap-2"><FiUserX />{stats?.inactiveCustomers ?? 0}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-gray-600">Revenue</div><div className="text-2xl font-bold flex items-center gap-2"><FiDollarSign className="text-primary" />{formatCurrency(stats?.totalRevenue ?? 0)}</div></CardBody></Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader title={editingId ? 'Edit Customer' : 'Create Customer'} />
          <CardBody>
            <form onSubmit={submitForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Name" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
              <Input label="Phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
              <Input label="City" value={form.city} onChange={(e) => setField('city', e.target.value)} />
              <Input label="Country" value={form.country} onChange={(e) => setField('country', e.target.value)} />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={cancelForm}>Cancel</Button>
                <Button type="submit" isLoading={saving}>{editingId ? 'Update Customer' : 'Create Customer'}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Customers"
          subtitle={`${filtered.length} customers`}
          action={
            <div className="w-72">
              <Input
                placeholder="Search name, email, phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<FiSearch className="w-4 h-4" />}
              />
            </div>
          }
        />
        <CardBody>
          {filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No customers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Value</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 flex items-center gap-2"><FiUsers className="w-4 h-4 text-primary" />{customer.name}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div>{customer.email || 'N/A'}</div>
                        <div>{customer.phone || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{[customer.city, customer.country].filter(Boolean).join(', ') || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatCurrency(customer.lifetimeValue)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(customer.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(customer)}><FiEdit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => archiveCustomer(customer.id)}><FiTrash2 className="w-4 h-4 text-red-600" /></Button>
                          <Badge variant={customer.isArchived ? 'warning' : 'success'}>{customer.isArchived ? 'Archived' : 'Active'}</Badge>
                        </div>
                      </td>
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

export default CustomersPage;
