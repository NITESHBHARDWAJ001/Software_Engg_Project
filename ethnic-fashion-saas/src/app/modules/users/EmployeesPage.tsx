import { useEffect, useState } from 'react';
import { FiBriefcase, FiCalendar, FiLock, FiMail, FiPhone, FiPlus, FiUser } from 'react-icons/fi';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  employeeService,
  type CreateEmployeePayload,
  type Employee,
  type EmploymentType,
} from '../../../services/api/employeeService';
import { useAuthStore } from '../../../store/authStore';
import { UserRole } from '../../../types';
import { formatDate } from '../../../utils/helpers';

type CreateFormState = CreateEmployeePayload;

const initialState: CreateFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  employmentType: 'FULL_TIME',
  employmentValidFrom: '',
  employmentValidTo: '',
  password: '',
};

const employmentTypeOptions: EmploymentType[] = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERN',
  'TEMPORARY',
];

const labelize = (value: string) => value.replace(/_/g, ' ');

const EmployeesPage = () => {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateFormState>(initialState);

  const canCreate = user?.role === UserRole.ORG_ADMIN;

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const setField = (field: keyof CreateFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreate) {
      toast.error('Only organization admin can create employees');
      return;
    }

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }

    setCreating(true);
    try {
      const employee = await employeeService.createEmployee({
        ...form,
        phone: form.phone || undefined,
        jobTitle: form.jobTitle || undefined,
        employmentValidFrom: form.employmentValidFrom || undefined,
        employmentValidTo: form.employmentValidTo || undefined,
      });
      setEmployees((prev) => [employee, ...prev]);
      setForm(initialState);
      toast.success('Employee created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create employee');
    } finally {
      setCreating(false);
    }
  };

  const toggleEmployeeStatus = async (employee: Employee) => {
    try {
      const updated = await employeeService.updateEmployeeStatus(employee.id, !employee.isActive);
      setEmployees((prev) => prev.map((row) => (row.id === employee.id ? updated : row)));
      toast.success(updated.isActive ? 'Employee activated' : 'Employee deactivated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update employee status');
    }
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">Create and manage employee accounts, employment type, and validity</p>
        </div>

        {canCreate && (
          <Card>
            <CardHeader title="Add Employee" subtitle="Set employment type and validity while creating account" />
            <CardBody>
              <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  leftIcon={<FiUser className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Last Name"
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  leftIcon={<FiUser className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  leftIcon={<FiMail className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Phone"
                  value={form.phone || ''}
                  onChange={(e) => setField('phone', e.target.value)}
                  leftIcon={<FiPhone className="w-4 h-4" />}
                />
                <Input
                  label="Job Title"
                  value={form.jobTitle || ''}
                  onChange={(e) => setField('jobTitle', e.target.value)}
                  leftIcon={<FiBriefcase className="w-4 h-4" />}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment Type</label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900"
                    value={form.employmentType}
                    onChange={(e) => setField('employmentType', e.target.value)}
                  >
                    {employmentTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {labelize(option)}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Valid From"
                  type="date"
                  value={form.employmentValidFrom || ''}
                  onChange={(e) => setField('employmentValidFrom', e.target.value)}
                  leftIcon={<FiCalendar className="w-4 h-4" />}
                />
                <Input
                  label="Valid To"
                  type="date"
                  value={form.employmentValidTo || ''}
                  onChange={(e) => setField('employmentValidTo', e.target.value)}
                  leftIcon={<FiCalendar className="w-4 h-4" />}
                />
                <Input
                  label="Temporary Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  leftIcon={<FiLock className="w-4 h-4" />}
                  helperText="Minimum 8 characters"
                  required
                />
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" isLoading={creating} leftIcon={<FiPlus className="w-4 h-4" />}>
                    Create Employee
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Manage Employees" subtitle={`Total ${employees.length} employees`} />
          <CardBody>
            {loading ? (
              <div className="text-gray-500">Loading employees...</div>
            ) : employees.length === 0 ? (
              <div className="text-gray-500">No employees found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employment</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Validity</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{employee.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {employee.employmentType ? labelize(employee.employmentType) : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {employee.employmentValidFrom
                            ? `${formatDate(employee.employmentValidFrom)} - ${employee.employmentValidTo ? formatDate(employee.employmentValidTo) : 'Open'}`
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={employee.isActive ? 'success' : 'warning'}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {canCreate && (
                            <Button
                              size="sm"
                              variant={employee.isActive ? 'outline' : 'primary'}
                              onClick={() => toggleEmployeeStatus(employee)}
                            >
                              {employee.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
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

export default EmployeesPage;
