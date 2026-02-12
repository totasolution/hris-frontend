import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { Select } from '../components/Select';
import { ConfirmModal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Candidate, CandidateDocument } from '../services/api';
import * as api from '../services/api';
import { downloadFromUrl } from '../utils/download';
import { formatDate } from '../utils/formatDate';

type TabType = 'overview' | 'onboarding' | 'documents' | 'contracts';

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [onboardingLink, setOnboardingLink] = useState<api.OnboardingLink | null>(null);
  const [onboardingData, setOnboardingData] = useState<api.OnboardingFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [submitHrdLoading, setSubmitHrdLoading] = useState(false);
  const [submitToClientLoading, setSubmitToClientLoading] = useState(false);
  const [showConfirmHrd, setShowConfirmHrd] = useState(false);
  const [editingOnboarding, setEditingOnboarding] = useState(false);
  const [onboardingEditForm, setOnboardingEditForm] = useState<Record<string, string>>({});
  const [onboardingSaveLoading, setOnboardingSaveLoading] = useState(false);
  const [candidateContracts, setCandidateContracts] = useState<api.Contract[]>([]);
  const [contractSigningUrls, setContractSigningUrls] = useState<Record<number, string>>({});
  const [editingEmploymentTerms, setEditingEmploymentTerms] = useState(false);
  const [employmentTermsForm, setEmploymentTermsForm] = useState<{ start_date?: string; duration_months?: number; salary?: string }>({});
  const [employmentTermsSaveLoading, setEmploymentTermsSaveLoading] = useState(false);
  const [sendingContract, setSendingContract] = useState<number | null>(null);
  const [hiring, setHiring] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const toast = useToast();

  const candidateId = id ? parseInt(id, 10) : 0;
  const candidateReturnTo = id ? `/candidates/${id}` : '';

  const load = async () => {
    if (!candidateId) return;
    setLoading(true);
    setError(null);
    try {
      const [c, docs] = await Promise.all([
        api.getCandidate(candidateId),
        api.getCandidateDocuments(candidateId),
      ]);
      setCandidate(c);
      setDocuments(docs);

      // Fetch onboarding data if status is relevant
      if (['onboarding', 'onboarding_completed', 'contract_requested', 'hired'].includes(c.screening_status)) {
        try {
          const data = await api.getOnboardingFormByCandidate(candidateId);
          setOnboardingData(data);
        } catch (e) {
          console.log('No onboarding data yet');
        }
      }

      // Always fetch contracts for this candidate (for display in Contracts section)
      try {
        const contractsRes = await api.getContracts({ candidate_id: candidateId, per_page: 100 });
        const contracts = contractsRes.data;
        setCandidateContracts(contracts);
        // Fetch signing links for contracts in "sent_for_signature" status
        const signingUrls: Record<number, string> = {};
        await Promise.all(
          contracts
            .filter(c => c.status === 'sent_for_signature')
            .map(async (contract) => {
              try {
                const { url } = await api.getContractSigningLink(contract.id);
                signingUrls[contract.id] = url;
              } catch (e) {
                // Signing link might not exist yet, ignore
              }
            })
        );
        setContractSigningUrls(signingUrls);
      } catch (e) {
        setCandidateContracts([]);
      }

      // Try to fetch existing onboarding link if status is onboarding
      if (c.screening_status === 'onboarding') {
        try {
          const link = await api.getOnboardingLinkByCandidate(candidateId);
          setOnboardingLink(link);
        } catch (e) {
          console.log('No active onboarding link found');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [candidateId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidateId) return;
    setUploading(true);
    try {
      await api.uploadCandidateDocument(candidateId, file);
      toast.success('File uploaded successfully');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateLink = async () => {
    if (!candidateId) return;
    setLinkLoading(true);
    try {
      const link = await api.createOnboardingLink(candidateId);
      setOnboardingLink(link);
      toast.success('Onboarding link generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleDownload = async (docId: number) => {
    try {
      const url = await api.getCandidateDocumentUrl(candidateId, docId);
      await downloadFromUrl(url, `document-${docId}.pdf`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get download URL');
    }
  };

  const copyLink = () => {
    if (!onboardingLink) return;
    const url = `${window.location.origin}/onboarding/${onboardingLink.token}`;
    navigator.clipboard.writeText(url);
    toast.info('Link copied to clipboard');
  };

  const handleSubmitForHRD = async () => {
    if (!candidateId) return;
    setSubmitHrdLoading(true);
    try {
      await api.requestContract(candidateId);
      toast.success('Contract requested successfully');
      setShowConfirmHrd(false);
      load(); // Refresh to show new status
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitHrdLoading(false);
    }
  };

  const handleSubmitToClient = async () => {
    if (!candidateId) return;
    setSubmitToClientLoading(true);
    try {
      const updated = await api.submitCandidateToClient(candidateId);
      setCandidate(updated);
      toast.success('Candidate submitted to client successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit to client');
    } finally {
      setSubmitToClientLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!candidateId) return;
    try {
      await api.updateCandidate(candidateId, { screening_status: newStatus });
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      load();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleHire = async () => {
    if (!candidateId) return;
    if (!confirm('Are you sure you want to complete the hiring process? This will create an employee record and user account with default password "S1gm@".')) {
      return;
    }
    setHiring(true);
    try {
      const result = await api.hireCandidate(candidateId);
      toast.success(result.message || 'Candidate successfully hired!');
      load(); // Refresh to show updated status
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to hire candidate');
    } finally {
      setHiring(false);
    }
  };

  if (loading || !candidate) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  const formLinkUrl = onboardingLink
    ? `${window.location.origin}/onboarding/${onboardingLink.token}`
    : null;

  const showGenerateLink = candidate.screening_status === 'interview_passed';
  const showRequestContract = candidate.screening_status === 'onboarding_completed';

  const isOnboardingRelevant = [
    'interview_passed',
    'onboarding',
    'onboarding_completed',
    'contract_requested',
    'hired',
  ].includes(candidate.screening_status);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'documents', label: 'Documents' },
    { id: 'contracts', label: 'Contracts' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-body">
      <PageHeader
        title={candidate.full_name}
        subtitle={candidate.email}
        actions={
          <ButtonLink to={candidateReturnTo ? `/candidates/${candidate.id}/edit?return=${encodeURIComponent(candidateReturnTo)}` : `/candidates/${candidate.id}/edit`} variant="secondary">
            Edit Profile
          </ButtonLink>
        }
      />

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
            candidate={candidate}
            candidateId={candidateId}
            candidateReturnTo={candidateReturnTo}
            isOnboardingRelevant={isOnboardingRelevant}
            onboardingLink={onboardingLink}
            onboardingData={onboardingData}
            showGenerateLink={showGenerateLink}
            showRequestContract={showRequestContract}
            formLinkUrl={formLinkUrl}
            handleSubmitToClient={handleSubmitToClient}
            handleStatusUpdate={handleStatusUpdate}
            handleCreateLink={handleCreateLink}
            copyLink={copyLink}
            handleHire={handleHire}
            setShowConfirmHrd={setShowConfirmHrd}
            submitToClientLoading={submitToClientLoading}
            linkLoading={linkLoading}
            submitHrdLoading={submitHrdLoading}
            hiring={hiring}
            candidateContracts={candidateContracts}
            editingEmploymentTerms={editingEmploymentTerms}
            setEditingEmploymentTerms={setEditingEmploymentTerms}
            employmentTermsForm={employmentTermsForm}
            setEmploymentTermsForm={setEmploymentTermsForm}
            employmentTermsSaveLoading={employmentTermsSaveLoading}
            setEmploymentTermsSaveLoading={setEmploymentTermsSaveLoading}
            setOnboardingData={setOnboardingData}
            toast={toast}
          />
        )}

        {activeTab === 'onboarding' && (
          <OnboardingTab
            candidateId={candidateId}
            onboardingData={onboardingData}
            editingOnboarding={editingOnboarding}
            setEditingOnboarding={setEditingOnboarding}
            onboardingEditForm={onboardingEditForm}
            setOnboardingEditForm={setOnboardingEditForm}
            onboardingSaveLoading={onboardingSaveLoading}
            setOnboardingSaveLoading={setOnboardingSaveLoading}
            setOnboardingData={setOnboardingData}
            toast={toast}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab
            documents={documents}
            handleUpload={handleUpload}
            handleDownload={handleDownload}
            uploading={uploading}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractsTab
            candidateId={candidateId}
            candidateReturnTo={candidateReturnTo}
            candidateContracts={candidateContracts}
            contractSigningUrls={contractSigningUrls}
            setContractSigningUrls={setContractSigningUrls}
            sendingContract={sendingContract}
            setSendingContract={setSendingContract}
            load={load}
            toast={toast}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmHrd}
        onClose={() => setShowConfirmHrd(false)}
        onConfirm={handleSubmitForHRD}
        title="Request Contract"
        confirmText="Yes, Request Contract"
        isLoading={submitHrdLoading}
      >
        <p>Are you sure you want to request a contract for <span className="font-bold text-brand-dark">{candidate.full_name}</span>?</p>
        <p className="mt-2 text-sm">This will notify the HRD team to begin the contract generation process.</p>
      </ConfirmModal>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  candidate,
  candidateId,
  candidateReturnTo,
  isOnboardingRelevant,
  onboardingLink,
  onboardingData,
  showGenerateLink,
  showRequestContract,
  formLinkUrl,
  handleSubmitToClient,
  handleStatusUpdate,
  handleCreateLink,
  copyLink,
  handleHire,
  setShowConfirmHrd,
  submitToClientLoading,
  linkLoading,
  submitHrdLoading,
  hiring,
  candidateContracts,
  editingEmploymentTerms,
  setEditingEmploymentTerms,
  employmentTermsForm,
  setEmploymentTermsForm,
  employmentTermsSaveLoading,
  setEmploymentTermsSaveLoading,
  setOnboardingData,
  toast,
}: {
  candidate: Candidate;
  candidateId: number;
  candidateReturnTo: string;
  isOnboardingRelevant: boolean;
  onboardingLink: api.OnboardingLink | null;
  onboardingData: api.OnboardingFormData | null;
  showGenerateLink: boolean;
  showRequestContract: boolean;
  formLinkUrl: string | null;
  handleSubmitToClient: () => Promise<void>;
  handleStatusUpdate: (s: string) => Promise<void>;
  handleCreateLink: () => Promise<void>;
  copyLink: () => void;
  handleHire: () => Promise<void>;
  setShowConfirmHrd: (v: boolean) => void;
  submitToClientLoading: boolean;
  linkLoading: boolean;
  submitHrdLoading: boolean;
  hiring: boolean;
  candidateContracts: api.Contract[];
  editingEmploymentTerms: boolean;
  setEditingEmploymentTerms: (v: boolean) => void;
  employmentTermsForm: { start_date?: string; duration_months?: number; salary?: string };
  setEmploymentTermsForm: React.Dispatch<React.SetStateAction<{ start_date?: string; duration_months?: number; salary?: string }>>;
  employmentTermsSaveLoading: boolean;
  setEmploymentTermsSaveLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setOnboardingData: React.Dispatch<React.SetStateAction<api.OnboardingFormData | null>>;
  toast: ReturnType<typeof useToast>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className={isOnboardingRelevant ? 'lg:col-span-2 space-y-8' : 'lg:col-span-3 space-y-8'}>
        {/* Status & Info */}
        <Card>
            <CardHeader>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">Candidate Information</h3>
            </CardHeader>
            <CardBody className={`grid gap-8 ${isOnboardingRelevant ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Current Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  candidate.screening_status === 'hired' ? 'bg-green-100 text-green-700' :
                  candidate.screening_status === 'rejected' ? 'bg-red-100 text-red-700' :
                  candidate.screening_status === 'contract_requested' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {candidate.screening_status.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Phone Number</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">PIC / Recruiter</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.pic_name ?? '—'}</p>
              </div>
              <div className={isOnboardingRelevant ? 'col-span-2 flex gap-3 pt-4 border-t border-slate-50' : 'col-span-3 flex gap-3 pt-4 border-t border-slate-50'}>
                {candidate.screening_status === 'screened_pass' && (
                  <Button 
                    onClick={handleSubmitToClient} 
                    className="!py-2 !text-xs"
                    disabled={submitToClientLoading}
                  >
                    {submitToClientLoading ? 'Submitting...' : 'Submit to Client'}
                  </Button>
                )}
                {(candidate.screening_status === 'submitted' || candidate.screening_status === 'interview_scheduled') && (
                  <>
                    <Button onClick={() => handleStatusUpdate('interview_passed')} className="!py-2 !text-xs">
                      Mark Interview Passed
                    </Button>
                    <Button onClick={() => handleStatusUpdate('interview_failed')} variant="ghost" className="!py-2 !text-xs !text-red-500 hover:!bg-red-50">
                      Mark Interview Failed
                    </Button>
                  </>
                )}
                {candidate.screening_status === 'screening' && (
                  <>
                    <Button onClick={() => handleStatusUpdate('screened_pass')} className="!py-2 !text-xs">
                      Pass Screening
                    </Button>
                    <Button onClick={() => handleStatusUpdate('screened_fail')} variant="ghost" className="!py-2 !text-xs !text-red-500 hover:!bg-red-50">
                      Fail Screening
                    </Button>
                  </>
                )}
                {(candidate.screening_status === 'contract_requested' || candidate.screening_status === 'onboarding_completed') && (
                  <Button 
                    onClick={handleHire} 
                    className="!py-2 !text-xs !bg-green-600 hover:!bg-green-700"
                    disabled={hiring}
                  >
                    {hiring ? 'Completing...' : 'Complete Hiring'}
                  </Button>
                )}
              </div>
              {candidate.screening_notes && (
                <div className={isOnboardingRelevant ? 'col-span-2' : 'col-span-3'}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Screening Notes</p>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl italic">
                    "{candidate.screening_notes}"
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Employment Terms (filled by recruiter) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">Employment Terms</h3>
              {!editingEmploymentTerms && (
                <Button
                  variant="secondary"
                  className="!py-1.5 !px-4 !text-xs"
                  onClick={() => {
                    setEmploymentTermsForm({
                      start_date: onboardingData?.employment_start_date ?? '',
                      duration_months: onboardingData?.employment_duration_months ?? undefined,
                      salary: onboardingData?.employment_salary ?? '',
                    });
                    setEditingEmploymentTerms(true);
                  }}
                >
                  {onboardingData?.employment_start_date || onboardingData?.employment_duration_months || onboardingData?.employment_salary ? 'Edit' : 'Add'}
                </Button>
              )}
            </CardHeader>
            <CardBody>
              {editingEmploymentTerms ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!candidateId) return;
                    setEmploymentTermsSaveLoading(true);
                    try {
                      const updated = await api.updateEmploymentTerms(candidateId, {
                        employment_start_date: employmentTermsForm.start_date || undefined,
                        employment_duration_months: employmentTermsForm.duration_months || undefined,
                        employment_salary: employmentTermsForm.salary || undefined,
                      });
                      setOnboardingData(updated);
                      setEditingEmploymentTerms(false);
                      toast.success('Employment terms updated');
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Update failed');
                    } finally {
                      setEmploymentTermsSaveLoading(false);
                    }
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Start Date"
                      name="start_date"
                      type="date"
                      value={employmentTermsForm.start_date ?? ''}
                      onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, start_date: e.target.value }))}
                    />
                    <Input
                      label="Contract Duration (Months)"
                      name="duration_months"
                      type="number"
                      min="1"
                      value={employmentTermsForm.duration_months ?? ''}
                      onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, duration_months: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                      placeholder="e.g. 12"
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Salary"
                        name="salary"
                        value={employmentTermsForm.salary ?? ''}
                        onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, salary: e.target.value }))}
                        placeholder="e.g. Rp 5.000.000"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <Button type="submit" disabled={employmentTermsSaveLoading}>
                      {employmentTermsSaveLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setEditingEmploymentTerms(false)} disabled={employmentTermsSaveLoading}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {[
                    { label: 'Start Date', value: onboardingData?.employment_start_date },
                    { label: 'Duration (Months)', value: onboardingData?.employment_duration_months ? `${onboardingData.employment_duration_months} months` : null },
                    { label: 'Salary', value: onboardingData?.employment_salary, full: true },
                  ].map((field, i) => (field.value != null && field.value !== '') ? (
                    <div key={i} className={(field as { full?: boolean }).full ? 'md:col-span-2' : ''}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                        {field.label}
                      </p>
                      <p className="text-sm font-bold text-brand-dark">
                        {field.value}
                      </p>
                    </div>
                  ) : null)}
                  {(!onboardingData?.employment_start_date && !onboardingData?.employment_duration_months && !onboardingData?.employment_salary) && (
                    <div className="md:col-span-2 text-center py-4 text-slate-400 text-sm">
                      No employment terms set yet. Click "Add" to set start date, duration, and salary.
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {isOnboardingRelevant && (
          <div className="space-y-8">
            {/* Onboarding Control */}
            <Card className="border-brand/20 bg-brand-lighter/20">
              <CardHeader>
                <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline">Onboarding Workflow</h3>
              </CardHeader>
              <CardBody className="space-y-6">
                {showGenerateLink && !formLinkUrl && (
                  <div className="space-y-4 text-center py-4">
                    <p className="text-sm text-slate-500 leading-relaxed">Client has approved. Generate a link for the candidate to fill their personal information.</p>
                    <Button
                      onClick={handleCreateLink}
                      disabled={linkLoading}
                      className="w-full"
                    >
                      {linkLoading ? 'Generating...' : 'Generate Onboarding Link'}
                    </Button>
                  </div>
                )}

                {formLinkUrl && candidate.screening_status === 'onboarding' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-xl border border-brand/10 shadow-sm text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-headline">Form Link Active</p>
                      <div className="flex gap-2 mb-2">
                        <Input value={formLinkUrl} readOnly className="flex-1 !py-1.5 !text-xs" />
                        <Button onClick={copyLink} variant="secondary" className="!px-3 !py-1.5 !text-xs">Copy</Button>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">Waiting for candidate to submit information...</p>
                    </div>
                  </div>
                )}

                {showRequestContract && (
                  <div className="space-y-4 text-center py-4">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100 mb-4">
                      <p className="text-xs text-green-700 font-bold">✓ Onboarding Form Submitted</p>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">Candidate has provided all required information. You can now request a contract from HRD.</p>
                    <Button
                      onClick={() => setShowConfirmHrd(true)}
                      disabled={submitHrdLoading}
                      className="w-full !bg-amber-500 hover:!bg-amber-600"
                    >
                      {submitHrdLoading ? 'Requesting...' : 'Request Contract'}
                    </Button>
                  </div>
                )}

                {candidate.screening_status === 'contract_requested' && (
                  <div className="space-y-4 text-center py-8">
                    <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-brand-dark font-headline">Contract Requested</h4>
                    <p className="text-xs text-slate-500">Waiting for HRD to generate and send the contract.</p>
                    {candidateContracts.length > 0 ? (
                      <div className="pt-2">
                        <ButtonLink to={candidateReturnTo ? `/contracts/${candidateContracts[0].id}/edit?return=${encodeURIComponent(candidateReturnTo)}` : `/contracts/${candidateContracts[0].id}/edit`} className="!px-4 !py-2 !text-xs">
                          View generated contract
                        </ButtonLink>
                        <p className="mt-2 text-[10px] text-slate-400">Or go to <Link to="/contracts" className="text-brand hover:underline">Contracts</Link> to manage all contracts.</p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 pt-2">Go to <Link to="/contracts" className="text-brand hover:underline">Contracts</Link> (filter by Draft) to view or edit the generated contract.</p>
                    )}
                  </div>
                )}

                {candidate.screening_status === 'hired' && (
                  <div className="space-y-4 text-center py-8">
                    <div className="h-12 w-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-brand-dark font-headline">Hired</h4>
                    <p className="text-xs text-slate-500">Candidate has signed the contract and is now an employee.</p>
                    {candidateContracts.length > 0 && (
                      <div className="pt-2">
                        <ButtonLink to={candidateReturnTo ? `/contracts/${candidateContracts[0].id}/edit?return=${encodeURIComponent(candidateReturnTo)}` : `/contracts/${candidateContracts[0].id}/edit`} variant="secondary" className="!px-4 !py-2 !text-xs">
                          View contract
                        </ButtonLink>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
    </div>
  );
}

// Onboarding Tab Component
function OnboardingTab({
  candidateId,
  onboardingData,
  editingOnboarding,
  setEditingOnboarding,
  onboardingEditForm,
  setOnboardingEditForm,
  onboardingSaveLoading,
  setOnboardingSaveLoading,
  setOnboardingData,
  toast,
}: {
  candidateId: number;
  onboardingData: api.OnboardingFormData | null;
  editingOnboarding: boolean;
  setEditingOnboarding: (v: boolean) => void;
  onboardingEditForm: Record<string, string>;
  setOnboardingEditForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onboardingSaveLoading: boolean;
  setOnboardingSaveLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setOnboardingData: React.Dispatch<React.SetStateAction<api.OnboardingFormData | null>>;
  toast: ReturnType<typeof useToast>;
}) {
  if (!onboardingData) {
    return (
      <Card>
        <CardBody className="py-12 text-center text-slate-400">
          <p className="text-sm">No onboarding data submitted yet.</p>
          <p className="text-xs mt-2">When the candidate completes the onboarding form, their information will appear here.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">Submitted Onboarding Data</h3>
        {!editingOnboarding && (
          <Button
            variant="secondary"
            className="!py-1.5 !px-4 !text-xs"
            onClick={() => {
              setOnboardingEditForm({
                id_number: onboardingData.id_number ?? '',
                address: onboardingData.address ?? '',
                place_of_birth: onboardingData.place_of_birth ?? '',
                date_of_birth: onboardingData.date_of_birth ?? '',
                gender: onboardingData.gender ?? 'male',
                religion: onboardingData.religion ?? '',
                marital_status: onboardingData.marital_status ?? 'single',
                bank_name: onboardingData.bank_name ?? '',
                bank_account_number: onboardingData.bank_account_number ?? '',
                bank_account_holder: onboardingData.bank_account_holder ?? '',
                npwp_number: onboardingData.npwp_number ?? '',
                emergency_contact_name: onboardingData.emergency_contact_name ?? '',
                emergency_contact_relationship: onboardingData.emergency_contact_relationship ?? '',
                emergency_contact_phone: onboardingData.emergency_contact_phone ?? '',
              });
              setEditingOnboarding(true);
            }}
          >
            Edit data
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {editingOnboarding ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!candidateId) return;
              setOnboardingSaveLoading(true);
              try {
                const updated = await api.updateOnboardingFormByCandidate(candidateId, onboardingEditForm as api.OnboardingFormDataEditable);
                setOnboardingData(updated);
                setEditingOnboarding(false);
                toast.success('Onboarding data updated');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Update failed');
              } finally {
                setOnboardingSaveLoading(false);
              }
            }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="ID Number (KTP)" name="id_number" value={onboardingEditForm.id_number ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, id_number: e.target.value }))} placeholder="16-digit ID number" />
              <Input label="Place of Birth" name="place_of_birth" value={onboardingEditForm.place_of_birth ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, place_of_birth: e.target.value }))} placeholder="City" />
              <Input label="Date of Birth" name="date_of_birth" type="date" value={onboardingEditForm.date_of_birth ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, date_of_birth: e.target.value }))} />
              <Select label="Gender" name="gender" value={onboardingEditForm.gender ?? 'male'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOnboardingEditForm((p) => ({ ...p, gender: e.target.value }))}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
              <Input label="Religion" name="religion" value={onboardingEditForm.religion ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, religion: e.target.value }))} placeholder="e.g. Islam, Christian" />
              <Select label="Marital Status" name="marital_status" value={onboardingEditForm.marital_status ?? 'single'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOnboardingEditForm((p) => ({ ...p, marital_status: e.target.value }))}>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
              </Select>
              <Input label="NPWP Number" name="npwp_number" value={onboardingEditForm.npwp_number ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, npwp_number: e.target.value }))} placeholder="Tax ID (optional)" />
              <div className="md:col-span-2">
                <Textarea label="Current Address" name="address" value={onboardingEditForm.address ?? ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOnboardingEditForm((p) => ({ ...p, address: e.target.value }))} rows={3} placeholder="Full residential address..." />
              </div>
              <Input label="Bank Name" name="bank_name" value={onboardingEditForm.bank_name ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, bank_name: e.target.value }))} placeholder="e.g. BCA, Mandiri" />
              <Input label="Account Number" name="bank_account_number" value={onboardingEditForm.bank_account_number ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, bank_account_number: e.target.value }))} placeholder="0000000000" />
              <div className="md:col-span-2">
                <Input label="Account Holder Name" name="bank_account_holder" value={onboardingEditForm.bank_account_holder ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, bank_account_holder: e.target.value }))} placeholder="Name as shown in bank book" />
              </div>
              <Input label="Emergency Contact Name" name="emergency_contact_name" value={onboardingEditForm.emergency_contact_name ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, emergency_contact_name: e.target.value }))} placeholder="Full name" />
              <Input label="Relationship" name="emergency_contact_relationship" value={onboardingEditForm.emergency_contact_relationship ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, emergency_contact_relationship: e.target.value }))} placeholder="e.g. Spouse, Parent" />
              <div className="md:col-span-2">
                <Input label="Emergency Contact Phone" name="emergency_contact_phone" value={onboardingEditForm.emergency_contact_phone ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, emergency_contact_phone: e.target.value }))} placeholder="+62..." />
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={onboardingSaveLoading}>
                {onboardingSaveLoading ? 'Saving...' : 'Save changes'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditingOnboarding(false)} disabled={onboardingSaveLoading}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {[
                { label: 'ID Number', value: onboardingData.id_number },
                { label: 'Place of Birth', value: onboardingData.place_of_birth },
                { label: 'Date of Birth', value: onboardingData.date_of_birth },
                { label: 'Gender', value: onboardingData.gender },
                { label: 'Religion', value: onboardingData.religion },
                { label: 'Marital Status', value: onboardingData.marital_status },
                { label: 'Address', value: onboardingData.address, full: true },
                { label: 'Bank Name', value: onboardingData.bank_name },
                { label: 'Bank Account Number', value: onboardingData.bank_account_number },
                { label: 'Bank Account Holder', value: onboardingData.bank_account_holder },
                { label: 'NPWP Number', value: onboardingData.npwp_number },
                { label: 'Emergency Contact', value: onboardingData.emergency_contact_name },
                { label: 'Relationship', value: onboardingData.emergency_contact_relationship },
                { label: 'Emergency Phone', value: onboardingData.emergency_contact_phone },
              ].map((field, i) => (field.value != null && field.value !== '') ? (
                <div key={i} className={(field as { full?: boolean }).full ? 'md:col-span-2' : ''}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">{field.label}</p>
                  <p className="text-sm font-bold text-brand-dark">{field.value}</p>
                </div>
              ) : null)}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50">
              <p className="text-[10px] text-slate-400 font-medium italic">
                Submitted on {onboardingData.submitted_at ? new Date(onboardingData.submitted_at).toLocaleString() : '—'}
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

// Documents Tab Component
function DocumentsTab({
  documents,
  handleUpload,
  handleDownload,
  uploading,
}: {
  documents: CandidateDocument[];
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownload: (docId: number) => void;
  uploading: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">Documents</h3>
        <label className="cursor-pointer group">
          <span className="text-xs font-bold text-brand group-hover:text-brand-dark uppercase tracking-widest transition-colors">
            {uploading ? 'Uploading...' : '+ Upload File'}
          </span>
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </CardHeader>
      <Table>
        <THead>
          <TR>
            <TH>File Name</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {documents.length === 0 ? (
            <TR>
              <TD colSpan={2} className="py-8 text-center text-slate-400">No documents uploaded yet.</TD>
            </TR>
          ) : (
            documents.map((doc) => (
              <TR key={doc.id}>
                <TD className="font-medium">{doc.file_name}</TD>
                <TD className="text-right">
                  <button
                    onClick={() => handleDownload(doc.id)}
                    className="p-2 text-slate-400 hover:text-brand transition-colors"
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

// Contracts Tab Component
function ContractsTab({
  candidateId,
  candidateReturnTo,
  candidateContracts,
  contractSigningUrls,
  setContractSigningUrls,
  sendingContract,
  setSendingContract,
  load,
  toast,
}: {
  candidateId: number;
  candidateReturnTo: string;
  candidateContracts: api.Contract[];
  contractSigningUrls: Record<number, string>;
  setContractSigningUrls: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  sendingContract: number | null;
  setSendingContract: (v: number | null) => void;
  load: () => Promise<void>;
  toast: ReturnType<typeof useToast>;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">Contracts</h3>
        <Link
          to="/contracts"
          className="text-xs font-bold text-brand hover:text-brand-dark uppercase tracking-widest transition-colors"
        >
          All contracts
        </Link>
      </CardHeader>
      <Table>
        <THead>
          <TR>
            <TH>Contract</TH>
            <TH>Status</TH>
            <TH>Created</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {candidateContracts.length === 0 ? (
            <TR>
              <TD colSpan={4} className="py-8 text-center text-slate-400">
                No contracts linked to this candidate yet.
              </TD>
            </TR>
          ) : (
            candidateContracts.map((contract) => (
              <TR key={contract.id}>
                <TD className="font-medium text-brand-dark">#{contract.id}</TD>
                <TD>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    contract.status === 'signed' ? 'bg-green-100 text-green-700' :
                    contract.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    contract.status === 'sent_for_signature' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {contract.status.replace(/_/g, ' ')}
                  </span>
                </TD>
                <TD className="text-sm text-slate-500">{contract.created_at ? formatDate(contract.created_at) : '—'}</TD>
                <TD className="text-right">
                  <div className="flex flex-col items-end gap-2">
                    {contract.status === 'draft' && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!candidateId) return;
                          setSendingContract(contract.id);
                          try {
                            const { url } = await api.createContractSigningLink(contract.id);
                            setContractSigningUrls(prev => ({ ...prev, [contract.id]: url }));
                            toast.success('Signing link created! URL copied to clipboard.');
                            navigator.clipboard.writeText(url);
                            await load();
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Failed to create signing link');
                          } finally {
                            setSendingContract(null);
                          }
                        }}
                        disabled={sendingContract === contract.id}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send contract for signature"
                      >
                        {sendingContract === contract.id ? 'Sending...' : 'Send for Signature'}
                      </button>
                    )}
                    {contract.status === 'sent_for_signature' && (
                      contractSigningUrls[contract.id] ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            readOnly
                            value={contractSigningUrls[contract.id]}
                            className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-600 font-mono max-w-xs"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(contractSigningUrls[contract.id]);
                              toast.info('Signing URL copied to clipboard');
                            }}
                            className="px-2 py-1 text-xs font-bold text-brand hover:text-brand-dark transition-colors"
                            title="Copy signing URL"
                          >
                            Copy URL
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!candidateId) return;
                            setSendingContract(contract.id);
                            try {
                              const { url } = await api.createContractSigningLink(contract.id);
                              setContractSigningUrls(prev => ({ ...prev, [contract.id]: url }));
                              toast.success('Signing link created! URL copied to clipboard.');
                              navigator.clipboard.writeText(url);
                              await load();
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Failed to create signing link');
                            } finally {
                              setSendingContract(null);
                            }
                          }}
                          disabled={sendingContract === contract.id}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                          title="Create signing link"
                        >
                          {sendingContract === contract.id ? 'Creating...' : 'Create Signing Link'}
                        </button>
                      )
                    )}
                    <div className="flex justify-end gap-2">
                      <Link
                        to={candidateReturnTo ? `/contracts/${contract.id}/edit?return=${encodeURIComponent(candidateReturnTo)}` : `/contracts/${contract.id}/edit`}
                        className="p-2 text-slate-400 hover:text-brand transition-colors"
                        title="Edit contract"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      {contract.file_path && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const url = await api.getContractPresignedUrl(contract.id);
                              await downloadFromUrl(url, `contract-${contract.id}.pdf`);
                            } catch (err) {
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
