import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../components/Card';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { EmployeeOverviewContent } from '../components/EmployeeOverviewContent';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Employee, Contract, PaklaringDocument, WarningLetter, EmployeeDocument } from '../services/api';
import * as api from '../services/api';
import { downloadFromUrl } from '../utils/download';
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
  const [detailClients, setDetailClients] = useState<api.Client[]>([]);
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
  const canEditEmployee = (emp: Employee | null) => {
    if (!emp) return false;
    if (emp.employee_type === 'internal' && permissions.includes('employee_internal:update')) return true;
    if (emp.employee_type === 'external' && permissions.includes('employee_external:update')) return true;
    return false;
  };
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
          canEditEmployee(employee) ? (
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
            clients={detailClients}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractsTab contracts={contracts} employeeId={employeeId} toast={toast} returnTo={`/employees/${employeeId}`} onPreview={openPreview} />
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
}: {
  employee: Employee;
  departments: api.Department[];
  clients: api.Client[];
}) {
  return (
    <EmployeeOverviewContent
      employee={employee}
      departments={departments}
      clients={clients}
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
}: { 
  contracts: Contract[]; 
  employeeId: number;
  toast: ReturnType<typeof useToast>;
  returnTo: string;
  onPreview: (getUrl: () => Promise<string>, title: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
          Employment Contracts
        </h3>
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
