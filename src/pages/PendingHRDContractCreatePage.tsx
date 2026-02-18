import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { Input, Label, FormGroup } from '../components/Input';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { formatDateLong } from '../utils/formatDate';

const PENDING_HRD_RETURN = '/onboarding/pending-hrd';

export default function PendingHRDContractCreatePage() {
  const { permissions = [] } = useAuth();
  const canApprove = permissions.includes('rc:approve');
  const [searchParams] = useSearchParams();
  const candidateIdParam = searchParams.get('candidate_id');
  const candidateIdNum = candidateIdParam ? parseInt(candidateIdParam, 10) : null;

  const navigate = useNavigate();
  const toast = useToast();
  const [candidateId, setCandidateId] = useState<string>(candidateIdParam ?? '');
  const [templateId, setTemplateId] = useState<string>('');
  const [contractNumber, setContractNumber] = useState<string>('');
  const [status, setStatus] = useState('draft');
  const [templates, setTemplates] = useState<api.ContractTemplate[]>([]);
  const [candidate, setCandidate] = useState<api.Candidate | null>(null);
  const [loading, setLoading] = useState(!!candidateIdParam);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<'template' | 'manual'>('template');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.getContractTemplates({ active_only: true }).then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    if (!candidateIdParam || !candidateIdNum) {
      setLoading(false);
      return;
    }
    setCandidateId(candidateIdParam);
    api
      .getCandidate(candidateIdNum)
      .then((c) => setCandidate(c))
      .catch(() => setError('Failed to load candidate'))
      .finally(() => setLoading(false));
  }, [candidateIdParam, candidateIdNum]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cid = candidateId ? parseInt(candidateId, 10) : undefined;
    if (!cid) {
      toast.error('Candidate is required');
      return;
    }

    if (creationMode === 'manual' && uploadFile) {
      setUploading(true);
      try {
        await api.uploadManualContract(uploadFile, {
          candidate_id: String(cid),
          contract_number: contractNumber || undefined,
          status,
        });
        await api.approveCandidate(cid);
        toast.success('Contract created and request approved');
        navigate(PENDING_HRD_RETURN, { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      await api.createContract({
        candidate_id: cid,
        template_id: templateId ? parseInt(templateId, 10) : undefined,
        contract_number: contractNumber || undefined,
        status,
      });
      await api.approveCandidate(cid);
      toast.success('Contract created and request approved');
      navigate(PENDING_HRD_RETURN, { replace: true });
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
        gender: '[Gender]',
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

  if (!canApprove) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card>
          <CardBody className="py-12 text-center space-y-4">
            <p className="text-slate-600 font-medium">You do not have permission to approve contract requests.</p>
            <ButtonLink to={PENDING_HRD_RETURN}>Back to Request Contract</ButtonLink>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!candidateIdParam) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <PageHeader title="Create Contract" subtitle="Approve request by creating contract" />
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-sm text-amber-800">Missing candidate. Please go back and approve from the Request Contract list.</p>
          <Link to={PENDING_HRD_RETURN} className="inline-block mt-3 text-sm font-bold text-brand hover:underline">
            ← Back to Request Contract
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Create Contract"
        subtitle={
          candidate
            ? `Create contract for ${candidate.full_name} — the request will be approved after you save`
            : 'Approve request by creating the contract'
        }
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
                Choose to create from a template or upload an existing contract file. After saving, the contract request will be marked as approved.
              </p>
            </FormGroup>

            {creationMode === 'manual' && (
              <FormGroup>
                <Label>Upload Contract File <span className="text-red-500">*</span></Label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.html"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                  }}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 file:cursor-pointer"
                />
                <p className="text-xs text-slate-400 mt-1">Accepted formats: PDF, DOC, DOCX, HTML</p>
                {uploadFile && (
                  <p className="text-xs text-green-600 mt-1">
                    Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </FormGroup>
            )}

            {creationMode === 'template' && (
              <FormGroup>
                <Label>Contract Template</Label>
                <div className="flex gap-2">
                  <Select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="flex-1"
                  >
                    <option value="">— Select Template —</option>
                    {templates.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.name} ({t.contract_type.toUpperCase()})
                      </option>
                    ))}
                  </Select>
                  {templateId && (
                    <Button type="button" variant="outline" onClick={handlePreviewTemplate}>
                      Preview
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Select a template. <Link to="/contract-templates" className="text-brand hover:underline">Manage templates</Link>
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
              </FormGroup>
              <FormGroup>
                <Label>Related Candidate</Label>
                <Input
                  value={candidate ? `${candidate.full_name} (${candidate.email})` : candidateId ? `Candidate #${candidateId}` : '—'}
                  readOnly
                  disabled
                  className="bg-slate-50 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Fixed from the approval request.</p>
              </FormGroup>
              <Select
                label="Contract Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="sent_for_signature">Sent for Signature</option>
                <option value="signed">Signed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={submitting || uploading || (creationMode === 'manual' && !uploadFile)}
              >
                {uploading ? 'Uploading...' : submitting ? 'Saving...' : creationMode === 'manual' ? 'Create Contract & Approve Request' : 'Create Contract & Approve Request'}
              </Button>
              <Link
                to={PENDING_HRD_RETURN}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>

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
                <iframe srcDoc={previewHtml} className="w-full min-h-[600px]" title="Template Preview" />
              </div>
            </div>
            <div className="flex justify-end gap-4 px-6 py-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
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
