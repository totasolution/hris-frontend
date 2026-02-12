import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Employee, Contract, PaklaringDocument, WarningLetter, EmployeeDocument } from '../services/api';
import * as api from '../services/api';
import { downloadFromUrl } from '../utils/download.ts';
import { formatDate, formatDateLong } from '../utils/formatDate';

type TabType = 'overview' | 'contracts' | 'documents' | 'history';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [paklaringDocs, setPaklaringDocs] = useState<PaklaringDocument[]>([]);
  const [warnings, setWarnings] = useState<WarningLetter[]>([]);
  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocument[]>([]);
  const [detailDepartments, setDetailDepartments] = useState<api.Department[]>([]);
  const [detailProjects, setDetailProjects] = useState<api.Project[]>([]);
  const [detailClients, setDetailClients] = useState<api.Client[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { permissions = [] } = useAuth();
  const canEditEmployee = permissions.includes('employee:update');

  const employeeId = id ? parseInt(id, 10) : 0;

  const load = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const [emp, contractsData, paklaringData, warningsData, documentsData, depts, projs, clis] = await Promise.all([
        api.getEmployee(employeeId),
        api.getContracts({ employee_id: employeeId, per_page: 100 }).then((r) => r.data).catch(() => []),
        api.getPaklaringByEmployee(employeeId).catch(() => []),
        api.getWarnings({ employee_id: employeeId, per_page: 100 }).then((r) => r.data).catch(() => []),
        api.getEmployeeDocuments(employeeId).catch(() => []),
        api.getDepartments(),
        api.getProjects(),
        api.getClients(),
      ]);
      setEmployee(emp);
      setContracts(contractsData);
      setPaklaringDocs(paklaringData);
      setWarnings(warningsData);
      setEmployeeDocuments(documentsData);
      setDetailDepartments(depts);
      setDetailProjects(projs);
      setDetailClients(clis);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [employeeId]);

  if (loading || !employee) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'documents', label: 'Documents' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-body">
      <PageHeader
        title={employee.full_name}
        subtitle={employee.email}
        actions={
          canEditEmployee ? (
            <ButtonLink to={`/employees/${employee.id}/edit?return=${encodeURIComponent(`/employees/${employee.id}`)}`} variant="secondary">
              Edit Profile
            </ButtonLink>
          ) : undefined
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-8 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <OverviewTab
            employee={employee}
            departments={detailDepartments}
            projects={detailProjects}
            clients={detailClients}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractsTab contracts={contracts} employeeId={employeeId} toast={toast} returnTo={`/employees/${employeeId}`} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab 
            paklaringDocs={paklaringDocs} 
            warnings={warnings}
            employeeDocuments={employeeDocuments}
            employeeId={employeeId}
            toast={toast}
            onPaklaringUploaded={load}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab employee={employee} contracts={contracts} warnings={warnings} />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  employee,
  departments,
  projects,
  clients,
}: {
  employee: Employee;
  departments: api.Department[];
  projects: api.Project[];
  clients: api.Client[];
}) {
  const displayDate = employee.join_date || employee.hire_date;
  
  return (
    <div className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Employee Information
            </h3>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                Employee Status
              </p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                employee.status === 'active' ? 'bg-green-100 text-green-700' :
                employee.status === 'terminated' ? 'bg-red-100 text-red-700' :
                employee.status === 'resigned' ? 'bg-orange-100 text-orange-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {employee.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                Employee Type
              </p>
              <p className="text-sm font-bold text-brand-dark capitalize">
                {employee.employee_type}
              </p>
            </div>
            {employee.employee_number && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                  Employee Number
                </p>
                <p className="text-sm font-bold text-brand-dark">{employee.employee_number}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                Email
              </p>
              <p className="text-sm font-bold text-brand-dark">{employee.email}</p>
            </div>
            {employee.company_email && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                  Company Email
                </p>
                <p className="text-sm font-bold text-brand-dark">{employee.company_email}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                Phone Number
              </p>
              <p className="text-sm font-bold text-brand-dark">{employee.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                Hire Date
              </p>
              <p className="text-sm font-bold text-brand-dark">
                {employee.hire_date ? formatDate(employee.hire_date) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                Join Date
              </p>
              <p className="text-sm font-bold text-brand-dark">
                {displayDate ? formatDate(displayDate) : '—'}
              </p>
            </div>
            {employee.department_id && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                  Department
                </p>
                <p className="text-sm font-bold text-brand-dark">
                  {departments.find((d) => d.id === employee.department_id)?.name ?? `ID: ${employee.department_id}`}
                </p>
              </div>
            )}
            {employee.client_id && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                  Client
                </p>
                <p className="text-sm font-bold text-brand-dark">
                  {clients.find((c) => c.id === employee.client_id)?.name ?? `ID: ${employee.client_id}`}
                </p>
              </div>
            )}
            {employee.project_id && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                  Project
                </p>
                <p className="text-sm font-bold text-brand-dark">
                  {projects.find((p) => p.id === employee.project_id)?.name ?? `ID: ${employee.project_id}`}
                </p>
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
                      {String(employee.termination_type).replace(/_/g, ' ')}
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

        {/* Personal Information */}
        {(employee.identification_id || employee.id_expired_date || employee.birthdate || employee.place_of_birth || employee.gender || employee.religion || employee.marital_status || employee.address || employee.village || employee.sub_district || employee.district || employee.province || employee.zip_code) && (
          <Card>
            <CardHeader>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
                Personal Information
              </h3>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {employee.identification_id && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    ID Number (KTP)
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{employee.identification_id}</p>
                </div>
              )}
              {employee.id_expired_date && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    ID Expired Date
                  </p>
                  <p className="text-sm font-bold text-brand-dark">
                    {formatDate(employee.id_expired_date)}
                  </p>
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
                  <p className="text-sm font-bold text-brand-dark capitalize">{String(employee.gender)}</p>
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
              {(employee.address || employee.village || employee.sub_district || employee.district || employee.province || employee.zip_code) && (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                    Address
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">
                    {[
                      employee.address,
                      employee.village && `Kel. ${employee.village}`,
                      employee.sub_district && `Kec. ${employee.sub_district}`,
                      employee.district && `Kab/Kota ${employee.district}`,
                      employee.province,
                      employee.zip_code,
                    ].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Financial Information */}
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

        {/* Emergency Contact */}
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

// Contracts Tab Component
function ContractsTab({ 
  contracts, 
  employeeId,
  toast,
  returnTo,
}: { 
  contracts: Contract[]; 
  employeeId: number;
  toast: ReturnType<typeof useToast>;
  returnTo: string;
}) {
  const newContractUrl = returnTo ? `/contracts/new?return=${encodeURIComponent(returnTo)}` : '/contracts/new';
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
          Employment Contracts
        </h3>
        <ButtonLink to={newContractUrl} variant="secondary" className="!py-1.5 !px-4 !text-xs">
          New Contract
        </ButtonLink>
      </CardHeader>
      <Table>
        <THead>
          <TR>
            <TH>Contract Number</TH>
            <TH>Status</TH>
            <TH>Created</TH>
            <TH>Signed</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {contracts.length === 0 ? (
            <TR>
              <TD colSpan={5} className="py-12 text-center text-slate-400">
                No contracts found for this employee.
              </TD>
            </TR>
          ) : (
            contracts.map((contract) => (
              <TR key={contract.id}>
                <TD className="font-medium text-brand-dark">
                  {contract.contract_number || `#${contract.id}`}
                </TD>
                <TD>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    contract.status === 'signed' ? 'bg-green-100 text-green-700' :
                    contract.status === 'sent_for_signature' ? 'bg-amber-100 text-amber-700' :
                    contract.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
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
                      to={returnTo ? `/contracts/${contract.id}/edit?return=${encodeURIComponent(returnTo)}` : `/contracts/${contract.id}/edit`}
                      className="p-2 text-slate-400 hover:text-brand transition-colors"
                      title="View/Edit contract"
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
                            const url = await api.getContractPresignedUrl(contract.id);
                            await downloadFromUrl(url, `contract-${contract.id}.pdf`);
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

// Documents Tab Component
function DocumentsTab({ 
  paklaringDocs, 
  warnings,
  employeeDocuments,
  employeeId,
  toast,
  onPaklaringUploaded,
}: { 
  paklaringDocs: PaklaringDocument[]; 
  warnings: WarningLetter[];
  employeeDocuments: EmployeeDocument[];
  employeeId: number;
  toast: ReturnType<typeof useToast>;
  onPaklaringUploaded?: () => void;
}) {
  const [uploadingPaklaring, setUploadingPaklaring] = useState(false);

  const handlePaklaringUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPaklaring(true);
    try {
      await api.uploadPaklaringForEmployee(employeeId, file);
      toast.success('Paklaring generated and employee notified');
      onPaklaringUploaded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingPaklaring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Employee Documents */}
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
                  <TD className="text-sm text-slate-500">
                    {formatDate(doc.created_at)}
                  </TD>
                  <TD className="text-right">
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
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>

      {/* Paklaring Documents */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Paklaring Documents
          </h3>
          <div>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePaklaringUpload}
              disabled={uploadingPaklaring}
              className="hidden"
              id="employee-paklaring-upload"
            />
            <label
              htmlFor="employee-paklaring-upload"
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors ${
                uploadingPaklaring ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand/10 text-brand hover:bg-brand/20'
              }`}
            >
              {uploadingPaklaring ? 'Uploading...' : 'Generate paklaring'}
            </label>
          </div>
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

      {/* Warning Letters */}
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Warning Letters
          </h3>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Type</TH>
              <TH>Warning Date</TH>
              <TH>Description</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {warnings.length === 0 ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-slate-400">
                  No warning letters found.
                </TD>
              </TR>
            ) : (
              warnings.map((warning) => (
                <TR key={warning.id}>
                  <TD>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
                      {warning.type}
                    </span>
                  </TD>
                  <TD className="text-sm text-slate-600">
                    {formatDate(warning.warning_date)}
                  </TD>
                  <TD className="text-sm text-slate-600 max-w-md truncate">
                    {warning.description || '—'}
                  </TD>
                  <TD className="text-right">
                    <Link
                      to={`/warnings/${warning.id}`}
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

// History Tab Component
function HistoryTab({ 
  employee, 
  contracts, 
  warnings 
}: { 
  employee: Employee; 
  contracts: Contract[]; 
  warnings: WarningLetter[];
}) {
  // Combine all events into a timeline
  const events: Array<{
    date: Date;
    type: 'hire' | 'contract' | 'warning' | 'termination';
    title: string;
    description: string;
  }> = [];

  // Add hire date
  if (employee.hire_date) {
    events.push({
      date: new Date(employee.hire_date),
      type: 'hire',
      title: 'Employee Hired',
      description: `Started employment as ${employee.employee_type}`,
    });
  }

  // Add contracts
  contracts.forEach((contract) => {
    if (contract.created_at) {
      events.push({
        date: new Date(contract.created_at),
        type: 'contract',
        title: `Contract ${contract.contract_number || `#${contract.id}`} Created`,
        description: `Status: ${contract.status}`,
      });
    }
    if (contract.signed_at) {
      events.push({
        date: new Date(contract.signed_at),
        type: 'contract',
        title: `Contract ${contract.contract_number || `#${contract.id}`} Signed`,
        description: 'Contract signed by employee',
      });
    }
  });

  // Add warnings
  warnings.forEach((warning) => {
    events.push({
      date: new Date(warning.warning_date),
      type: 'warning',
      title: `Warning Letter Issued`,
      description: `Type: ${warning.type}${warning.description ? ` - ${warning.description}` : ''}`,
    });
  });

  // Add termination
  if (employee.termination_date) {
    events.push({
      date: new Date(employee.termination_date),
      type: 'termination',
      title: 'Employment Terminated',
      description: employee.termination_reason || `Type: ${employee.termination_type || 'N/A'}`,
    });
  }

  // Sort by date (newest first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Card>
      <CardHeader>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
          Employment Timeline
        </h3>
      </CardHeader>
      <CardBody>
        {events.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            No history available.
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={index} className="flex gap-4 pb-6 border-b border-slate-100 last:border-0">
                <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${
                  event.type === 'hire' ? 'bg-green-500' :
                  event.type === 'termination' ? 'bg-red-500' :
                  event.type === 'warning' ? 'bg-orange-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-900">{event.title}</h4>
                    <span className="text-xs text-slate-400">
                      {formatDateLong(event.date)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
