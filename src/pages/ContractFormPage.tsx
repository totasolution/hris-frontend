import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Select as NativeSelect } from '../components/Select';
import { Input, Label, FormGroup } from '../components/Input';
import { useToast } from '../components/Toast';
import * as api from '../services/api';
import { formatDateLong } from '../utils/formatDate';

const searchableSelectStyles = {
  control: (base: object) => ({
    ...base,
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
    minHeight: 42,
    '&:hover': { borderColor: '#107BC7' },
  }),
  option: (base: object, state: { isSelected?: boolean; isFocused?: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? '#107BC7' : state.isFocused ? '#E8F5FF' : 'white',
    color: state.isSelected ? 'white' : '#282828',
  }),
};

/** Safe internal path for redirect (starts with /, no protocol or external link). */
function getReturnPath(search: string): string | null {
  const returnTo = new URLSearchParams(search).get('return');
  if (!returnTo || !returnTo.startsWith('/') || returnTo.includes('://') || returnTo.startsWith('//')) {
    return null;
  }
  return returnTo;
}

export default function ContractFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const returnTo = getReturnPath(location.search);
  const isEdit = id !== 'new' && id != null;
  const navigate = useNavigate();
  const toast = useToast();
  const [employeeId, setEmployeeId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [contractNumber, setContractNumber] = useState<string>('');
  const [contractSignedUrl, setContractSignedUrl] = useState<string>('');
  const [status, setStatus] = useState('draft');
  const [contract, setContract] = useState<api.Contract | null>(null);
  const [employees, setEmployees] = useState<api.Employee[]>([]);
  const [templates, setTemplates] = useState<api.ContractTemplate[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<'template' | 'manual'>('template');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.getEmployees({ per_page: 1000 }).then((r) => setEmployees(r.data)).catch(() => {});
    api.getContractTemplates({ active_only: true }).then(setTemplates).catch(() => {});
  }, []);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: String(e.id), label: `${e.full_name} (${e.email})` })),
    [employees]
  );
  const selectedEmployee = employeeOptions.find((o) => o.value === employeeId) ?? null;

  // For contract create/edit: only show contract templates (exclude payslip)
  const contractTemplates = useMemo(
    () => templates.filter((t) => t.contract_type !== 'payslip'),
    [templates]
  );

  useEffect(() => {
    if (!isEdit || !id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const c = await api.getContract(parseInt(id, 10));
        setContract(c);
        setEmployeeId(c.employee_id ? String(c.employee_id) : '');
        setTemplateId(c.template_id ? String(c.template_id) : '');
        setContractNumber(c.contract_number ?? '');
        setContractSignedUrl(c.contract_signed_url ?? '');
        setStatus(c.status ?? 'draft');
        // Determine creation mode: if has template_id, use 'template', otherwise if has file_path, use 'manual'
        if (c.template_id) {
          setCreationMode('template');
        } else if (c.file_path) {
          setCreationMode('manual');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // If manual upload mode and file is selected (create or edit), use upload endpoint
    if (creationMode === 'manual' && uploadFile) {
      setUploading(true);
      try {
        if (isEdit && id) {
          // Update contract file and metadata
          await api.updateContractFile(parseInt(id, 10), uploadFile);
          await api.updateContract(parseInt(id, 10), {
            employee_id: employeeId ? parseInt(employeeId, 10) : undefined,
            contract_number: contractNumber || undefined,
            status,
          });
          toast.success('Contract updated successfully');
          navigate(returnTo ?? '/contracts', { replace: true });
        } else {
          await api.uploadManualContract(uploadFile, {
            employee_id: employeeId || undefined,
            contract_number: contractNumber || undefined,
            status: status,
          });
          navigate(returnTo ?? '/contracts', { replace: true });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
      return;
    }
    
    // Template mode: require template when creating
    if (creationMode === 'template' && !isEdit && !templateId) {
      toast.error('Please select a contract template');
      return;
    }

    // Otherwise, use regular create/update
    setSubmitting(true);
    try {
      const body: Partial<api.Contract> = {
        employee_id: employeeId ? parseInt(employeeId, 10) : undefined,
        template_id: templateId ? parseInt(templateId, 10) : undefined,
        contract_number: contractNumber || undefined,
        status,
        contract_signed_url: creationMode === 'template' ? (contractSignedUrl || undefined) : undefined,
      };
      if (isEdit && id) {
        await api.updateContract(parseInt(id, 10), body);
      } else {
        await api.createContract(body);
      }
      navigate(returnTo ?? '/contracts', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewTemplate = async () => {
    if (!templateId) {
      toast.error('Please select a template first');
      return;
    }
    try {
      // Get sample values for preview
      const sampleValues: Record<string, string> = {
        contract_number: contractNumber || 'PKWT-2026-XXX',
        contract_date: formatDateLong(new Date()),
        company_name: 'PT Your Company',
        company_address: 'Company Address',
        company_representative: 'HR Director',
        representative_position: 'Human Resources Director',
        full_name: '[Candidate Name]',
        email: 'email@example.com',
        phone: '08123456789',
        id_number: '[ID Number]',
        address: '[Address]',
        place_of_birth: '[Place of Birth]',
        date_of_birth: '[Date of Birth]',
        gender: 'Laki-laki', // or Perempuan
        religion: '[Religion]',
        marital_status: '[Marital Status]',
        bank_name: '[Bank Name]',
        bank_account_number: '[Account Number]',
        bank_account_holder: '[Account Holder]',
        npwp_number: '[NPWP]',
        position: '[Position]',
        start_date: '[Start Date]',
        end_date: '[End Date]',
        salary: '[Salary]',
        work_location: '[Work Location]',
        other_terms: '',
      };
      const html = await api.previewContractTemplate(parseInt(templateId, 10), sampleValues);
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Preview failed');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title={isEdit ? 'Edit Contract' : 'New Contract'}
        subtitle={isEdit ? `Updating contract #${id}` : 'Create a new employment agreement'}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader title="Contract Details" />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormGroup>
              <Label>Creation Method</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="creationMode"
                    value="template"
                    checked={creationMode === 'template'}
                    onChange={(e) => setCreationMode(e.target.value as 'template' | 'manual')}
                    className="w-4 h-4 text-brand"
                  />
                  <span className="text-sm font-medium">Use Template</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="creationMode"
                    value="manual"
                    checked={creationMode === 'manual'}
                    onChange={(e) => setCreationMode(e.target.value as 'template' | 'manual')}
                    className="w-4 h-4 text-brand"
                  />
                  <span className="text-sm font-medium">Upload File Manually</span>
                </label>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isEdit 
                  ? 'Change the contract creation method or update contract details'
                  : 'Choose to create from a template or upload an existing contract file'}
              </p>
            </FormGroup>
            
            {creationMode === 'manual' && (
              <FormGroup>
                <Label>Upload Contract File {!isEdit && <span className="text-red-500">*</span>}</Label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.html"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 file:cursor-pointer"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {isEdit 
                    ? 'Upload a new file to replace the existing contract file. Accepted formats: PDF, DOC, DOCX, HTML'
                    : 'Upload a PDF, Word document, or HTML file. Accepted formats: PDF, DOC, DOCX, HTML'}
                </p>
                {uploadFile && (
                  <p className="text-xs text-green-600 mt-1">
                    Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {isEdit && contract?.file_path && !uploadFile && (
                  <p className="text-xs text-slate-500 mt-1">
                    Current file: {contract.file_path.split('/').pop() || contract.file_path}
                  </p>
                )}
              </FormGroup>
            )}
            
            {creationMode === 'template' && (
              <FormGroup>
                <Label>Contract Template <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <NativeSelect
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="flex-1"
                    required={creationMode === 'template' && !isEdit}
                  >
                    <option value="">— Select Template —</option>
                    {contractTemplates.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.name} ({t.contract_type.toUpperCase()})
                      </option>
                    ))}
                  </NativeSelect>
                  {templateId && (
                    <Button type="button" variant="outline" onClick={handlePreviewTemplate}>
                      Preview
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Select a template to use for this contract. You can manage templates in{' '}
                  <Link to="/contract-templates" className="text-brand hover:underline">Document Templates</Link>.
                </p>
              </FormGroup>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup>
                <Label>Contract Number</Label>
                <Input
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="e.g., PKWT-2026-001"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Unique identifier for this contract
                </p>
              </FormGroup>
              <FormGroup>
                <Label>Related Employee</Label>
                <Select
                  placeholder="— Search employee —"
                  isClearable
                  isSearchable
                  options={employeeOptions}
                  value={selectedEmployee}
                  onChange={(opt) => setEmployeeId(opt?.value ?? '')}
                  styles={searchableSelectStyles}
                  noOptionsMessage={() => 'No employees found'}
                />
              </FormGroup>
              <NativeSelect
                label="Contract Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="sent_for_signature">Sent for Signature</option>
                <option value="signed">Signed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </NativeSelect>
            </div>

            {creationMode === 'template' && (
              <FormGroup>
                <Label>Signed Document URL</Label>
                {status === 'draft' ? (
                  <>
                    <Input
                      type="url"
                      value={contractSignedUrl}
                      onChange={(e) => setContractSignedUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Link to the signed document from a 3rd party (e.g. e-sign provider). Editable only while status is Draft.
                    </p>
                  </>
                ) : contractSignedUrl ? (
                  <a
                    href={contractSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand hover:underline break-all"
                  >
                    {contractSignedUrl}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">—</p>
                )}
              </FormGroup>
            )}

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={
                  submitting ||
                  uploading ||
                  (creationMode === 'manual' && !uploadFile && !isEdit) ||
                  (creationMode === 'template' && !isEdit && !templateId)
                }
              >
                {uploading ? 'Uploading...' : submitting ? 'Saving...' : isEdit ? 'Update Contract' : creationMode === 'manual' ? 'Upload Contract' : 'Create Contract'}
              </Button>
              <Link
                to={returnTo ?? '/contracts'}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Generated document: only when editing a draft contract */}
      {isEdit && id && status === 'draft' && (
        <Card>
          <CardHeader title="Generated Document" />
          <CardBody>
            <p className="text-sm text-slate-600 mb-4">
              Generate a viewable document (HTML) from the contract draft using the selected template. 
              {templateId ? ' The document will be rendered with data from the employee.' : ' Please select a template to use for rendering.'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={generating || !templateId}
                onClick={async () => {
                  setGenerating(true);
                  setError(null);
                  try {
                    const updated = await api.generateContractDocument(parseInt(id, 10));
                    setContract(updated);
                    toast.success('Document generated');
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Generate failed');
                  } finally {
                    setGenerating(false);
                  }
                }}
              >
                {generating ? 'Generating...' : contract?.file_path ? 'Regenerate document' : 'Generate document'}
              </Button>
              {contract?.file_path && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await api.downloadContractDocument(parseInt(id, 10));
                    } catch (err) {
                      toast.error('Failed to open document');
                    }
                  }}
                >
                  Download document
                </Button>
              )}
            </div>
            {!templateId && (
              <p className="text-xs text-amber-600 mt-2">
                Select a contract template above to enable document generation.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Template Preview Modal */}
      {showPreview && previewHtml && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Template Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full min-h-[600px]"
                  title="Template Preview"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 px-6 py-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  const win = window.open('', '_blank');
                  if (win) {
                    win.document.write(previewHtml);
                    win.document.close();
                  }
                }}
              >
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
