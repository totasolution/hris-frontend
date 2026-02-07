import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import * as api from '../services/api';

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== 'new' && id != null;
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('active');
  const [userType, setUserType] = useState('internal');
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [roles, setRoles] = useState<api.Role[]>([]);
  const [departments, setDepartments] = useState<api.Department[]>([]);
  const [employees, setEmployees] = useState<api.Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [roleList, deptList, employeeList] = await Promise.all([
          api.getRoles(),
          api.getDepartments(),
          api.getEmployees({ per_page: 1000 }).then((r) => r.data).catch(() => []),
        ]);
        setRoles(roleList);
        setDepartments(deptList);
        setEmployees(employeeList);
        if (isEdit && id) {
          const detail = await api.getUser(parseInt(id, 10));
          setEmail(detail.user.email);
          setFullName(detail.user.full_name);
          setPhone(detail.user.phone ?? '');
          setUsername(detail.user.username ?? '');
          setStatus(detail.user.status ?? 'active');
          setUserType(detail.user.user_type ?? 'internal');
          setRoleIds(detail.role_ids ?? []);
          setDepartmentIds(detail.department_ids ?? []);
          setEmployeeId(detail.user.employee_id != null ? String(detail.user.employee_id) : '');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id]);

  const toggleRole = (roleId: number) => {
    setRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const toggleDepartment = (deptId: number) => {
    setDepartmentIds((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await api.updateUser(parseInt(id, 10), {
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          username: username.trim() || undefined,
          status,
          employee_id: employeeId ? parseInt(employeeId, 10) : null,
          role_ids: roleIds,
          department_ids: departmentIds,
        });
      } else {
        if (!password.trim()) {
          setError('Password is required for new users');
          setSubmitting(false);
          return;
        }
        await api.createUser({
          email: email.trim(),
          password: password.trim(),
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          username: username.trim() || undefined,
          user_type: userType,
          status,
          role_ids: roleIds,
          department_ids: departmentIds,
        });
      }
      navigate('/users');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={isEdit ? 'Edit User' : 'New User'}
        subtitle={isEdit ? `Managing account for ${fullName}` : 'Create a new system user account'}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardBody className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isEdit}
                placeholder="user@example.com"
              />
              {!isEdit && (
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 8 characters"
                />
              )}
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter full name"
              />
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62..."
              />
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Optional username"
              />
              <Select
                label="Account Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Select>
              {isEdit && (
                <Select
                  label="Assign Employee"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                >
                  <option value="">None</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                      {emp.company_email ? ` (${emp.company_email})` : emp.email ? ` (${emp.email})` : ''}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardBody className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Assigned Roles</h3>
              <div className="space-y-2">
                {roles.map((r) => (
                  <label key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-light transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={roleIds.includes(r.id)}
                      onChange={() => toggleRole(r.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-brand transition-colors">{r.name}</span>
                      {r.description && <span className="text-[10px] text-slate-400">{r.description}</span>}
                    </div>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Departments</h3>
              <div className="space-y-2">
                {departments.map((d) => (
                  <label key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-light transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={departmentIds.includes(d.id)}
                      onChange={() => toggleDepartment(d.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20"
                    />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-brand transition-colors">{d.name}</span>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update User Account' : 'Create User Account'}
          </Button>
          <Link
            to="/users"
            className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
