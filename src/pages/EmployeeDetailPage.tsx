import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../components/Card';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { EmployeeOverviewContent } from '../components/EmployeeOverviewContent';
import { OnboardingDeclarationChecklistView } from '../components/OnboardingDeclarationChecklistView';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Employee, Contract, PaklaringDocument, WarningLetter, EmployeeDocument, OnboardingFormData, DeclarationChecklistData } from '../services/api';
import * as api from '../services/api';
import { downloadFromUrl } from '../utils/download';
import { formatDate, formatDateLong } from '../utils/formatDate';

type TabType = 'overview' | 'contracts' | 'documents' | 'history' | 'declaration';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [paklaringDocs, setPaklaringDocs] = useState<PaklaringDocument[]>([]);
  const [warnings, setWarnings] = useState<WarningLetter[]>([]);
  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocument[]>([]);
  const [detailDepartments, setDetailDepartments] = useState<api.Department[]>([]);
  const [detailClients, setDetailClients] = useState<api.Client[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingFormData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const toast = useToast();

  const openPreview = async (getUrl: () => Promise<string>, title: string) => {
    setPreviewOpen(true);
    setPreviewUrl(null);
    setPreviewTitle(title);
    setPreviewLoading(true);
    try {
      const url = await getUrl();
      setPreviewUrl(url);
    } catch {
      toast.error('Failed to load document');
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };
  const { permissions = [] } = useAuth();
  const canEditEmployeeSections = permissions.includes('employee_external:update');
  const canDeletePaklaring = permissions.includes('paklaring:delete');

  const employeeId = id ? parseInt(id, 10) : 0;

  const load = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const [emp, contractsData, paklaringData, warningsData, documentsData, depts, clis] = await Promise.all([
        api.getEmployee(employeeId),
        api.getContracts({ employee_id: employeeId, per_page: 100 }).then((r) => r.data).catch(() => []),
        api.getPaklaringByEmployee(employeeId).catch(() => []),
        api.getWarnings({ employee_id: employeeId, per_page: 100 }).then((r) => r.data).catch(() => []),
        api.getEmployeeDocuments(employeeId).catch(() => []),
        api.getDepartments(),
        api.getClients(),
      ]);
      setEmployee(emp);
      setContracts(contractsData);
      setPaklaringDocs(paklaringData);
      setWarnings(warningsData);
      setEmployeeDocuments(documentsData);
      setDetailDepartments(depts);
      setDetailClients(clis);
      if (emp.candidate_id) {
        api.getOnboardingFormByCandidate(emp.candidate_id).then(setOnboardingData).catch(() => {});
      }
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
    { id: 'declaration', label: 'Declaration' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-body">
      <PageHeader
        title={employee.full_name}
        subtitle={employee.email}
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
            clients={detailClients}
            canEdit={canEditEmployeeSections}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractsTab contracts={contracts} employeeId={employeeId} toast={toast} returnTo={`/employees/${employeeId}`} onPreview={openPreview} onExtended={load} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab 
            paklaringDocs={paklaringDocs}
            canDeletePaklaring={canDeletePaklaring} 
            warnings={warnings}
            employeeDocuments={employeeDocuments}
            employeeId={employeeId}
            toast={toast}
            onPaklaringUploaded={load}
            onPreview={openPreview}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab employee={employee} contracts={contracts} warnings={warnings} />
        )}

        {activeTab === 'declaration' && (
          onboardingData?.declaration_checklist
            ? <OnboardingDeclarationChecklistView
                data={onboardingData.declaration_checklist as DeclarationChecklistData}
                submittedAt={onboardingData.submitted_at}
              />
            : <Card><CardBody className="py-12 text-center text-slate-400">No declaration data available.</CardBody></Card>
        )}
      </div>

      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewTitle}
        src={previewUrl}
        isLoading={previewLoading}
      />
    </div>
  );
}

// Overview Tab Component — uses shared full employee overview
function OverviewTab({
  employee,
  departments,
  clients,
  canEdit,
}: {
  employee: Employee;
  departments: api.Department[];
  clients: api.Client[];
  canEdit: boolean;
}) {
  return (
    <EmployeeOverviewContent
      employee={employee}
      departments={departments}
      clients={clients}
      canEdit={canEdit}
    />
  );
}

// Contracts Tab Component
function ContractsTab({
  contracts,
  employeeId,
  toast,
  returnTo,
  onPreview,
  onExtended,
}: {
  contracts: Contract[];
  employeeId: number;
  toast: ReturnType<typeof useToast>;
  returnTo: string;
  onPreview: (getUrl: () => Promise<string>, title: string) => void;
  onExtended?: () => void;
}) {
  const [extendTarget, setExtendTarget] = useState<Contract | null>(null);
  const [extendForm, setExtendForm] = useState({ contract_number: '', duration_months: '' });
  const [extending, setExtending] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExtendTarget(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openExtendDrawer = (contract: Contract) => {
    setExtendForm({ contract_number: '', duration_months: '' });
    setExtendTarget(contract);
  };

  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendTarget) return;
    setExtending(true);
    try {
      const months = extendForm.duration_months ? parseInt(extendForm.duration_months, 10) : undefined;
      await api.extendContract(extendTarget.id, {
        contract_number: extendForm.contract_number || undefined,
        duration_months: months,
      });
      toast.success('Extension contract created as draft.');
      setExtendTarget(null);
      onExtended?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to extend contract');
    } finally {
      setExtending(false);
    }
  };

  const formatPeriod = (start?: string, end?: string) => {
    if (!start && !end) return null;
    const fmt = (d: string) => formatDate(d, { year: 'numeric', month: 'short', day: 'numeric' });
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return `From ${fmt(start)}`;
    return `Until ${end ? formatDate(end, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}`;
  };

  return (
    <>
    <Card className="overflow-hidden">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
          Employment Contracts
        </h3>
      </CardHeader>
      <Table>
        <THead>
          <TR>
            <TH>Contract</TH>
            <TH>Period</TH>
            <TH>Status</TH>
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
            contracts.map((contract) => {
              const period = formatPeriod(contract.contract_start, contract.contract_end);
              const isExtensionAllowed = contract.status === 'signed';
              return (
                <TR key={contract.id}>
                  <TD>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-brand-dark">
                        {contract.contract_number || `#${contract.id}`}
                      </span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        contract.contract_kind === 'extension'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {contract.contract_kind === 'extension' ? 'Extension' : 'Initial'}
                      </span>
                    </div>
                  </TD>
                  <TD className="text-sm text-slate-500">
                    {period ?? '—'}
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
                    {contract.signed_at ? formatDate(contract.signed_at) : '—'}
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      {isExtensionAllowed && (
                        <button
                          type="button"
                          onClick={() => openExtendDrawer(contract)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                          title="Extend contract"
                        >
                          Extend
                        </button>
                      )}
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
                        <>
                          <button
                            type="button"
                            onClick={() => onPreview(
                              () => api.getContractPresignedUrl(contract.id),
                              contract.contract_number || `Contract #${contract.id}`
                            )}
                            className="p-2 text-slate-400 hover:text-brand transition-colors"
                            title="Preview"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
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
                        </>
                      )}
                    </div>
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </Card>

      {/* Extend Contract Drawer */}
      {extendTarget && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setExtendTarget(null)}
          />
          {/* Slide-over panel */}
          <div
            ref={drawerRef}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-brand-dark font-headline tracking-tight">Extend Contract</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extending: {extendTarget.contract_number || `#${extendTarget.id}`}
                  {extendTarget.contract_end && (
                    <span className="ml-1">
                      · ends {formatDate(extendTarget.contract_end, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExtendTarget(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleExtendSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  New Contract Number <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={extendForm.contract_number}
                  onChange={(e) => setExtendForm((f) => ({ ...f, contract_number: e.target.value }))}
                  placeholder="e.g. PKW/2025/001-EXT"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Duration <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={extendForm.duration_months}
                    onChange={(e) => setExtendForm((f) => ({ ...f, duration_months: e.target.value }))}
                    placeholder="e.g. 12"
                    className="w-32 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                  <span className="text-sm text-slate-500">months</span>
                </div>
                {extendTarget.contract_end && extendForm.duration_months && parseInt(extendForm.duration_months, 10) > 0 && (() => {
                  const startDate = new Date(extendTarget.contract_end);
                  startDate.setDate(startDate.getDate() + 1);
                  const endDate = new Date(startDate);
                  endDate.setMonth(endDate.getMonth() + parseInt(extendForm.duration_months, 10));
                  endDate.setDate(endDate.getDate() - 1);
                  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                  return (
                    <p className="mt-2 text-xs text-slate-500">
                      New period: <span className="font-semibold text-slate-700">{fmt(startDate)}</span> – <span className="font-semibold text-slate-700">{fmt(endDate)}</span>
                    </p>
                  );
                })()}
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setExtendTarget(null)}
                  disabled={extending}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extending}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {extending ? 'Creating…' : 'Create Extension'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
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
  canDeletePaklaring,
  onPreview,
}: { 
  paklaringDocs: PaklaringDocument[]; 
  warnings: WarningLetter[];
  employeeDocuments: EmployeeDocument[];
  employeeId: number;
  toast: ReturnType<typeof useToast>;
  onPaklaringUploaded?: () => void;
  canDeletePaklaring?: boolean;
  onPreview: (getUrl: () => Promise<string>, title: string) => void;
}) {
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
                    <div className="flex justify-end gap-0">
                      <button
                        type="button"
                        onClick={() => onPreview(
                          () => api.getEmployeeDocumentUrl(employeeId, doc.id),
                          doc.file_name || `Document ${doc.type}`
                        )}
                        className="p-2 text-slate-400 hover:text-brand transition-colors"
                        title="Preview"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const url = await api.getEmployeeDocumentUrl(employeeId, doc.id);
                            await downloadFromUrl(url, doc.file_name || `document-${doc.id}.pdf`);
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
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>

      {/* Paklaring Documents */}
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Paklaring Documents
          </h3>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Document No.</TH>
              <TH>Last working date</TH>
              <TH>Generated Date</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {paklaringDocs.length === 0 ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-slate-400">
                  No paklaring documents found.
                </TD>
              </TR>
            ) : (
              paklaringDocs.map((doc) => (
                <TR key={doc.id}>
                  <TD className="text-sm font-medium text-slate-700">
                    {doc.document_number || '—'}
                  </TD>
                  <TD className="text-sm text-slate-600">
                    {doc.last_working_date ? formatDateLong(doc.last_working_date) : '—'}
                  </TD>
                  <TD className="text-sm text-slate-600">
                    {formatDateLong(doc.generated_at)}
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-0">
                      <button
                        type="button"
                        onClick={() => onPreview(
                          () => api.getPaklaringPresignedUrl(doc.id),
                          doc.document_number ? `Paklaring ${doc.document_number}` : `Paklaring #${doc.id}`
                        )}
                        className="p-2 text-slate-400 hover:text-brand transition-colors"
                        title="Preview"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
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
                      {canDeletePaklaring && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm('Delete this paklaring document? The file will be removed from storage.')) return;
                            try {
                              await api.deletePaklaring(doc.id);
                              toast.success('Paklaring document deleted');
                              onPaklaringUploaded?.();
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Delete failed');
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete paklaring"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
              <TH>Document No.</TH>
              <TH>Type</TH>
              <TH>Warning Date</TH>
              <TH>Description</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {warnings.length === 0 ? (
              <TR>
                <TD colSpan={5} className="py-8 text-center text-slate-400">
                  No warning letters found.
                </TD>
              </TR>
            ) : (
              warnings.map((warning) => (
                <TR key={warning.id}>
                  <TD className="text-sm text-slate-600 font-mono">{warning.document_number ?? '—'}</TD>
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

  // Add termination (use last working date if available, otherwise skip)
  if (employee.last_working_date) {
    events.push({
      date: new Date(employee.last_working_date),
      type: 'termination',
      title: 'Employment Ended',
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
