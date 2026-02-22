import { useEffect, useState } from 'react';
import { Link, Outlet, useOutletContext } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useToast } from '../components/Toast';
import type { Employee, Contract, PaklaringDocument, WarningLetter, EmployeeDocument, Payslip } from '../services/api';
import * as api from '../services/api';
import { downloadFromUrl } from '../utils/download.ts';
import { formatDate, formatDateLong, addMonths } from '../utils/formatDate';
import { formatGender } from '../utils/formatGender';
import MyTicketsPage from './MyTicketsPage';

export type MySpaceContext = {
  employee: Employee | null;
  error: string | null;
  contracts: Contract[];
  paklaringDocs: PaklaringDocument[];
  warnings: WarningLetter[];
  employeeDocuments: EmployeeDocument[];
  payslips: Payslip[];
  loadContractsAndDocuments: (employeeId: number) => Promise<void>;
  toast: ReturnType<typeof useToast>;
};

/** Layout for /me/* routes: loads employee + data, renders Outlet with context. */
export function MySpaceLayout() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [paklaringDocs, setPaklaringDocs] = useState<PaklaringDocument[]>([]);
  const [warnings, setWarnings] = useState<WarningLetter[]>([]);
  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocument[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const loadContractsAndDocuments = async (employeeId: number) => {
    try {
      const [contractsData, paklaringData, warningsData, docsData, payslipsData] = await Promise.all([
        api.getContracts({ employee_id: employeeId, per_page: 100 }).then((r) => r.data).catch(() => []),
        api.getMyPaklaring().catch(() => []),
        api.getMyWarnings().catch(() => []),
        api.getEmployeeDocuments(employeeId).catch(() => []),
        api.getMyPayslips().catch(() => []),
      ]);
      setContracts(contractsData);
      setPaklaringDocs(paklaringData);
      setWarnings(warningsData);
      setEmployeeDocuments(docsData);
      setPayslips(payslipsData);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getMyEmployee()
      .then(setEmployee)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (employee?.id) loadContractsAndDocuments(employee.id);
  }, [employee?.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  const context: MySpaceContext = {
    employee,
    error,
    contracts,
    paklaringDocs,
    warnings,
    employeeDocuments,
    payslips,
    loadContractsAndDocuments,
    toast,
  };

  return (
    <div className="max-w-6xl mx-auto font-body">
      {employee && (
        <>
          <PageHeader
            title={employee.full_name}
            subtitle={employee.email}
          />
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 mb-6">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}
        </>
      )}
      {!employee && (
        <PageHeader title="My Space" subtitle="Your profile and account" />
      )}
      <Outlet context={context} />
    </div>
  );
}

/** My Profile: 2 tabs — Profile, Change Password */
export function MyProfilePage() {
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const ctx = useOutletContext() as MySpaceContext;

  if (!ctx.employee) {
    return (
      <div className="space-y-8">
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-slate-600 font-medium">
              No employee profile is linked to your account. Please contact HR if you believe this is an error.
            </p>
            <div className="mt-6">
              <ButtonLink to={`/tickets/new?return=${encodeURIComponent('/me/profile')}`}>New support ticket</ButtonLink>
            </div>
          </CardBody>
        </Card>
        <AccountTab toast={ctx.toast} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200">
        <nav className="flex gap-8 -mb-px">
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
              tab === 'profile' ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setTab('password')}
            className={`px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
              tab === 'password' ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Change Password
          </button>
        </nav>
      </div>
      {tab === 'profile' && <ProfileTab employee={ctx.employee} />}
      {tab === 'password' && <AccountTab toast={ctx.toast} />}
    </div>
  );
}

/** My Contracts */
export function MyContractsPage() {
  const ctx = useOutletContext() as MySpaceContext;
  if (!ctx.employee) return <NoEmployeeMessage />;
  return <MySpaceContractsTab contracts={ctx.contracts} toast={ctx.toast} />;
}

/** My Documents */
export function MyDocumentsPage() {
  const ctx = useOutletContext() as MySpaceContext;
  if (!ctx.employee) return <NoEmployeeMessage />;
  return (
    <MySpaceDocumentsTab
      paklaringDocs={ctx.paklaringDocs}
      warnings={ctx.warnings}
      employeeDocuments={ctx.employeeDocuments}
      employeeId={ctx.employee.id}
      toast={ctx.toast}
      onDocumentsChange={() => ctx.employee && ctx.loadContractsAndDocuments(ctx.employee.id)}
    />
  );
}

/** My Payslips */
export function MyPayslipsPage() {
  const ctx = useOutletContext() as MySpaceContext;
  if (!ctx.employee) return <NoEmployeeMessage />;
  return <MySpacePayslipsTab payslips={ctx.payslips} toast={ctx.toast} />;
}

/** My Tickets */
export function MyTicketsOutlet() {
  return <MyTicketsPage embedded />;
}

function NoEmployeeMessage() {
  return (
    <Card>
      <CardBody className="py-12 text-center">
        <p className="text-slate-600 font-medium">
          No employee profile is linked to your account. Link your profile to see contracts, documents, and payslips.
        </p>
        <div className="mt-6">
          <ButtonLink to="/me/profile">Go to My Profile</ButtonLink>
        </div>
      </CardBody>
    </Card>
  );
}

export default MySpaceLayout;

function ProfileTab({ employee }: { employee: Employee }) {
  const displayDate = employee.join_date || employee.hire_date;

  return (
    <div className="space-y-8">
      <Card>
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Employee Information
            </h3>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                Employee Status
              </p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  employee.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : employee.status === 'terminated'
                      ? 'bg-red-100 text-red-700'
                      : employee.status === 'resigned'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-600'
                }`}
              >
                {employee.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                Employee Type
              </p>
              <p className="text-sm font-bold text-brand-dark capitalize">{employee.employee_type}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                Phone Number
              </p>
              <p className="text-sm font-bold text-brand-dark">{employee.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                Join Date
              </p>
              <p className="text-sm font-bold text-brand-dark">
                {displayDate ? formatDate(displayDate) : '—'}
              </p>
            </div>
            {(employee.company_email || employee.email) && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                  {employee.company_email ? 'Company Email' : 'Email'}
                </p>
                <p className="text-sm font-bold text-brand-dark">{employee.company_email ?? employee.email}</p>
              </div>
            )}
            {employee.employee_number && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                  Employee Number
                </p>
                <p className="text-sm font-bold text-brand-dark">{employee.employee_number}</p>
              </div>
            )}
            {employee.termination_date && (
              <>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Termination Date
                  </p>
                  <p className="text-sm font-bold text-brand-dark">
                    {formatDate(employee.termination_date)}
                  </p>
                </div>
                {employee.termination_type && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                      Termination Type
                    </p>
                    <p className="text-sm font-bold text-brand-dark capitalize">
                      {employee.termination_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
              </>
            )}
            {employee.termination_reason && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                  Termination Reason
                </p>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">
                  {employee.termination_reason}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {(employee.identification_id ||
          employee.birthdate ||
          employee.place_of_birth ||
          employee.gender ||
          employee.religion ||
          employee.marital_status ||
          employee.address) && (
          <Card>
            <CardHeader>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
                Personal Information
              </h3>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-8">
              {employee.identification_id && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    ID Number (KTP)
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{employee.identification_id}</p>
                </div>
              )}
              {employee.place_of_birth && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Place of Birth
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{employee.place_of_birth}</p>
                </div>
              )}
              {employee.birthdate && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Date of Birth
                  </p>
                  <p className="text-sm font-bold text-brand-dark">
                    {formatDate(employee.birthdate)}
                  </p>
                </div>
              )}
              {employee.gender && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Gender
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{formatGender(employee.gender)}</p>
                </div>
              )}
              {employee.religion && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Religion
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{employee.religion}</p>
                </div>
              )}
              {employee.marital_status && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Marital Status
                  </p>
                  <p className="text-sm font-bold text-brand-dark capitalize">{employee.marital_status}</p>
                </div>
              )}
              {employee.address && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Address
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">
                    {employee.address}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {(employee.npwp || employee.bank_account || employee.bank_account_holder) && (
          <Card>
            <CardHeader>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
                Financial Information
              </h3>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-8">
              {employee.npwp && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    NPWP Number
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{employee.npwp}</p>
                </div>
              )}
              {employee.bank_account && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Bank Account Number
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{employee.bank_account}</p>
                </div>
              )}
              {employee.bank_account_holder && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Bank Account Holder
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{employee.bank_account_holder}</p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {(employee.emergency_contact || employee.emergency_phone) && (
          <Card>
            <CardHeader>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
                Emergency Contact
              </h3>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-8">
              {employee.emergency_contact && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Contact Name
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{employee.emergency_contact}</p>
                </div>
              )}
              {employee.emergency_phone && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Contact Phone
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{employee.emergency_phone}</p>
                </div>
              )}
            </CardBody>
          </Card>
        )}
    </div>
  );
}

function AccountTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.changeMyPassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const eyeIcon = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
  const eyeOffIcon = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <div className="space-y-8">
      <Card className="max-w-md">
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Change Password
          </h3>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Current password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title={showCurrent ? 'Hide password' : 'Show password'}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? eyeOffIcon : eyeIcon}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                New password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title={showNew ? 'Hide password' : 'Show password'}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? eyeOffIcon : eyeIcon}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title={showConfirm ? 'Hide password' : 'Show password'}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? eyeOffIcon : eyeIcon}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

const returnToMe = '/me';

function MySpaceContractsTab({
  contracts,
  toast,
}: {
  contracts: Contract[];
  toast: ReturnType<typeof useToast>;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
          My Contracts
        </h3>
      </CardHeader>
      <Table>
        <THead>
          <TR>
            <TH>Contract</TH>
            <TH>Status</TH>
            <TH>Created</TH>
            <TH>Signed</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {contracts.length === 0 ? (
            <TR>
              <TD colSpan={5} className="py-8 text-center text-slate-400">
                No contracts found.
              </TD>
            </TR>
          ) : (
            contracts.map((contract) => (
              <TR key={contract.id}>
                <TD className="font-medium text-brand-dark">
                  {contract.contract_number || `#${contract.id}`}
                </TD>
                <TD>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      contract.status === 'signed'
                        ? 'bg-green-100 text-green-700'
                        : contract.status === 'sent_for_signature'
                          ? 'bg-amber-100 text-amber-700'
                          : contract.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {contract.status.replace(/_/g, ' ')}
                  </span>
                </TD>
                <TD className="text-sm text-slate-500">
                  {contract.created_at ? formatDate(contract.created_at) : '—'}
                </TD>
                <TD className="text-sm text-slate-500">
                  {contract.signed_at ? formatDate(contract.signed_at) : '—'}
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/contracts/${contract.id}/edit?return=${encodeURIComponent(returnToMe)}`}
                      className="p-2 text-slate-400 hover:text-brand transition-colors"
                      title="View contract"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    {contract.file_path && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await api.downloadContractDocument(contract.id);
                          } catch {
                            toast.error('Failed to open document');
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-brand transition-colors"
                        title="Download document"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}
                  </div>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </Card>
  );
}

function MySpacePayslipsTab({
  payslips,
  toast,
}: {
  payslips: Payslip[];
  toast: ReturnType<typeof useToast>;
}) {
  const handleDownload = async (p: Payslip) => {
    try {
      await api.downloadPayslipDocument(p.id, `payslip-${p.period_label || p.id}.pdf`);
    } catch {
      toast.error('Failed to open payslip');
    }
  };
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
          My Payslips
        </h3>
      </CardHeader>
      <Table>
        <THead>
          <TR>
            <TH>Period</TH>
            <TH>Created</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {payslips.length === 0 ? (
            <TR>
              <TD colSpan={3} className="py-8 text-center text-slate-400">
                No payslips found.
              </TD>
            </TR>
          ) : (
            payslips.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium text-brand-dark">{p.period_label}</TD>
                <TD className="text-sm text-slate-500">
                  {formatDate(p.created_at)}
                </TD>
                <TD className="text-right">
                  <button
                    type="button"
                    onClick={() => handleDownload(p)}
                    className="p-2 text-slate-400 hover:text-brand transition-colors"
                    title="Download"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </Card>
  );
}

function MySpaceDocumentsTab({
  paklaringDocs,
  warnings,
  employeeDocuments,
  employeeId,
  toast,
  onDocumentsChange,
}: {
  paklaringDocs: PaklaringDocument[];
  warnings: WarningLetter[];
  employeeDocuments: EmployeeDocument[];
  employeeId: number;
  toast: ReturnType<typeof useToast>;
  onDocumentsChange: () => void;
}) {
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    setDeleting(docId);
    try {
      await api.deleteEmployeeDocument(employeeId, docId);
      toast.success('Document deleted');
      onDocumentsChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Employee Documents
          </h3>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Document Type</TH>
              <TH>File Name</TH>
              <TH>Uploaded</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {employeeDocuments.length === 0 ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-slate-400">
                  No documents found.
                </TD>
              </TR>
            ) : (
              employeeDocuments.map((doc) => (
                <TR key={doc.id}>
                  <TD>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                      {doc.type}
                    </span>
                  </TD>
                  <TD className="text-sm text-slate-600 font-medium">{doc.file_name}</TD>
                  <TD className="text-sm text-slate-500">{formatDate(doc.created_at)}</TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const url = await api.getEmployeeDocumentUrl(employeeId, doc.id);
                            await downloadFromUrl(url, `document-${doc.id}.pdf`);
                          } catch {
                            toast.error('Failed to open document');
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-brand transition-colors"
                        title="Download document"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleting === doc.id}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete document"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Paklaring Documents
          </h3>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Generated Date</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {paklaringDocs.length === 0 ? (
              <TR>
                <TD colSpan={2} className="py-8 text-center text-slate-400">
                  No paklaring documents found.
                </TD>
              </TR>
            ) : (
              paklaringDocs.map((doc) => (
                <TR key={doc.id}>
                  <TD className="text-sm text-slate-600">
                    {formatDateLong(doc.generated_at)}
                  </TD>
                  <TD className="text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const url = await api.getPaklaringPresignedUrl(doc.id);
                          await downloadFromUrl(url, `paklaring-${doc.id}.pdf`);
                        } catch {
                          toast.error('Failed to open document');
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-brand transition-colors"
                      title="Download paklaring"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Warning Letters
          </h3>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Document No.</TH>
              <TH>Type</TH>
              <TH>Warning Date</TH>
              <TH>Warning Due</TH>
              <TH>Description</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {warnings.length === 0 ? (
              <TR>
                <TD colSpan={6} className="py-8 text-center text-slate-400">
                  No warning letters found.
                </TD>
              </TR>
            ) : (
              warnings.map((warning) => (
                <TR key={warning.id}>
                  <TD className="text-sm font-mono text-slate-700">
                    {warning.document_number ?? '—'}
                  </TD>
                  <TD>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
                      {warning.type}
                    </span>
                  </TD>
                  <TD className="text-sm text-slate-600">
                    {formatDate(warning.warning_date)}
                  </TD>
                  <TD className="text-sm text-slate-600">
                    {warning.duration_months != null
                      ? formatDate(addMonths(warning.warning_date, warning.duration_months))
                      : '—'}
                  </TD>
                  <TD className="text-sm text-slate-600 max-w-md truncate">{warning.description || '—'}</TD>
                  <TD className="text-right">
                    <Link
                      to={`/warnings/${warning.id}`}
                      state={{ from: 'me-documents' }}
                      className="p-2 text-slate-400 hover:text-brand transition-colors"
                      title="View warning"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
