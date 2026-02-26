import React, { useEffect, useState } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import { downloadFromUrl } from '../utils/download.ts';
import { formatDate } from '../utils/formatDate';
import { formatGender } from '../utils/formatGender';

type TabType = 'overview' | 'onboarding' | 'documents';

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
  const [editingEmploymentTerms, setEditingEmploymentTerms] = useState(false);
  const [employmentTermsForm, setEmploymentTermsForm] = useState<{
    start_date?: string;
    duration_months?: number;
    salary?: string;
    positional_allowance?: string;
    transport_allowance?: string;
    comm_allowance?: string;
    misc_allowance?: string;
    bpjs_kes?: string;
    bpjs_tku?: string;
    bpjs_bpu?: string;
    insurance_provider?: string;
    insurance_no?: string;
    overtime_nominal?: string;
  }>({});
  const [employmentTermsSaveLoading, setEmploymentTermsSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const toast = useToast();
  const { permissions = [] } = useAuth();

  const candidateId = id ? parseInt(id, 10) : 0;
  const candidateReturnTo = id ? `/candidates/${id}` : '';
  const canUploadCandidateDoc = permissions.includes('candidate:upload_doc');
  const canDeleteCandidateDoc = permissions.includes('candidate:delete_doc');

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

      // Fetch onboarding data if status is relevant (including interview_passed for employment terms validation)
      if (['interview_passed', 'onboarding', 'onboarding_completed', 'ojt', 'contract_requested', 'hired'].includes(c.screening_status)) {
        try {
          const data = await api.getOnboardingFormByCandidate(candidateId);
          setOnboardingData(data);
        } catch (e) {
          console.log('No onboarding data yet');
        }
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

  const handleUpload = async (file: File, documentType: api.CandidateDocumentType) => {
    if (!file || !candidateId) return;
    setUploading(true);
    try {
      await api.uploadCandidateDocument(candidateId, file, documentType);
      toast.success('File uploaded successfully');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!candidateId) return;
    const hasEmploymentTerms =
      onboardingData?.employment_start_date &&
      onboardingData?.employment_duration_months &&
      onboardingData?.employment_salary;
    if (!hasEmploymentTerms) {
      toast.error('Please complete Employment Terms (Start Date, Duration, and Salary) before generating the onboarding link.');
      return;
    }
    setLinkLoading(true);
    try {
      const link = await api.createOnboardingLink(candidateId);
      setOnboardingLink(link);
      // Update candidate status in state so the link block shows without refresh (backend sets status to 'onboarding')
      setCandidate((prev) => (prev ? { ...prev, screening_status: 'onboarding' } : prev));
      toast.success('Onboarding link generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleDownload = async (docId: number) => {
    try {
      const doc = documents.find((d) => d.id === docId);
      const filename = doc?.file_name ?? `document-${docId}`;
      const url = await api.getCandidateDocumentUrl(candidateId, docId);
      await downloadFromUrl(url, filename);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get download URL');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!candidateId) return;
    try {
      await api.deleteCandidateDocument(candidateId, docId);
      toast.success('Document deleted');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete document');
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
  const showRequestContract =
    candidate.screening_status === 'onboarding_completed' ||
    candidate.screening_status === 'ojt' ||
    (candidate.screening_status === 'contract_requested' && !!onboardingData?.hrd_rejected_at);
  const contractRequestedWaitingHrd =
    candidate.screening_status === 'contract_requested' && !onboardingData?.hrd_rejected_at;

  const isOnboardingRelevant = [
    'interview_passed',
    'onboarding',
    'onboarding_completed',
    'ojt',
    'contract_requested',
    'hired',
  ].includes(candidate.screening_status);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'documents', label: 'Documents' },
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
            contractRequestedWaitingHrd={contractRequestedWaitingHrd}
            formLinkUrl={formLinkUrl}
            handleSubmitToClient={handleSubmitToClient}
            handleStatusUpdate={handleStatusUpdate}
            handleCreateLink={handleCreateLink}
            copyLink={copyLink}
            setShowConfirmHrd={setShowConfirmHrd}
            submitToClientLoading={submitToClientLoading}
            linkLoading={linkLoading}
            submitHrdLoading={submitHrdLoading}
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
            candidateId={candidateId}
            documents={documents}
            uploading={uploading}
            canUpload={canUploadCandidateDoc}
            canDelete={canDeleteCandidateDoc}
            onUpload={handleUpload}
            onDownload={handleDownload}
            onDelete={handleDeleteDocument}
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
  contractRequestedWaitingHrd,
  formLinkUrl,
  handleSubmitToClient,
  handleStatusUpdate,
  handleCreateLink,
  copyLink,
  setShowConfirmHrd,
  submitToClientLoading,
  linkLoading,
  submitHrdLoading,
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
  contractRequestedWaitingHrd: boolean;
  formLinkUrl: string | null;
  handleSubmitToClient: () => Promise<void>;
  handleStatusUpdate: (s: string) => Promise<void>;
  handleCreateLink: () => Promise<void>;
  copyLink: () => void;
  setShowConfirmHrd: (v: boolean) => void;
  submitToClientLoading: boolean;
  linkLoading: boolean;
  submitHrdLoading: boolean;
  editingEmploymentTerms: boolean;
  setEditingEmploymentTerms: (v: boolean) => void;
  employmentTermsForm: {
    start_date?: string;
    duration_months?: number;
    salary?: string;
    positional_allowance?: string;
    transport_allowance?: string;
    comm_allowance?: string;
    misc_allowance?: string;
    bpjs_kes?: string;
    bpjs_tku?: string;
    bpjs_bpu?: string;
    insurance_provider?: string;
    insurance_no?: string;
    overtime_nominal?: string;
  };
  setEmploymentTermsForm: React.Dispatch<React.SetStateAction<{
    start_date?: string;
    duration_months?: number;
    salary?: string;
    positional_allowance?: string;
    transport_allowance?: string;
    comm_allowance?: string;
    misc_allowance?: string;
    bpjs_kes?: string;
    bpjs_tku?: string;
    bpjs_bpu?: string;
    insurance_provider?: string;
    insurance_no?: string;
    overtime_nominal?: string;
  }>>;
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
            <CardBody className={`grid gap-6 ${isOnboardingRelevant ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Full Name</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.full_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Email</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Phone Number</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Employment Type</p>
                <p className="text-sm font-bold text-brand-dark">
                  {candidate.employment_type === 'pkwt' ? 'PKWT' : candidate.employment_type === 'partnership' ? 'Mitra Kerja' : candidate.employment_type ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Current Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  candidate.screening_status === 'hired' ? 'bg-green-100 text-green-700' :
                  candidate.screening_status === 'rejected' ? 'bg-red-100 text-red-700' :
                  candidate.screening_status === 'contract_requested' ? 'bg-amber-100 text-amber-700' :
                  candidate.screening_status === 'ojt' ? 'bg-teal-100 text-teal-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {candidate.screening_status.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">OJT Option</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.ojt_option === true ? 'Yes' : candidate.ojt_option === false ? 'No' : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Client</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.client_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">PIC / Recruiter</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.pic_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Created At</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.created_at ? formatDate(candidate.created_at, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Updated At</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.updated_at ? formatDate(candidate.updated_at, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
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
                      positional_allowance: onboardingData?.employment_positional_allowance ?? '',
                      transport_allowance: onboardingData?.employment_transport_allowance ?? '',
                      comm_allowance: onboardingData?.employment_comm_allowance ?? '',
                      misc_allowance: onboardingData?.employment_misc_allowance ?? '',
                      bpjs_kes: onboardingData?.employment_bpjs_kes ?? '',
                      bpjs_tku: onboardingData?.employment_bpjs_tku ?? '',
                      bpjs_bpu: onboardingData?.employment_bpjs_bpu ?? '',
                      insurance_provider: onboardingData?.employment_insurance_provider ?? '',
                      insurance_no: onboardingData?.employment_insurance_no ?? '',
                      overtime_nominal: onboardingData?.employment_overtime_nominal ?? '',
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
                        employment_positional_allowance: employmentTermsForm.positional_allowance || undefined,
                        employment_transport_allowance: employmentTermsForm.transport_allowance || undefined,
                        employment_comm_allowance: employmentTermsForm.comm_allowance || undefined,
                        employment_misc_allowance: employmentTermsForm.misc_allowance || undefined,
                        employment_bpjs_kes: employmentTermsForm.bpjs_kes || undefined,
                        employment_bpjs_tku: employmentTermsForm.bpjs_tku || undefined,
                        employment_bpjs_bpu: employmentTermsForm.bpjs_bpu || undefined,
                        employment_insurance_provider: employmentTermsForm.insurance_provider || undefined,
                        employment_insurance_no: employmentTermsForm.insurance_no || undefined,
                        employment_overtime_nominal: employmentTermsForm.overtime_nominal || undefined,
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
                    <Input label="Tunjangan Jabatan" name="positional_allowance" value={employmentTermsForm.positional_allowance ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, positional_allowance: e.target.value }))} placeholder="e.g. Rp 500.000" />
                    <Input label="Tunjangan Transportasi" name="transport_allowance" value={employmentTermsForm.transport_allowance ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, transport_allowance: e.target.value }))} placeholder="e.g. Rp 500.000" />
                    <Input label="Tunjangan Komunikasi" name="comm_allowance" value={employmentTermsForm.comm_allowance ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, comm_allowance: e.target.value }))} placeholder="e.g. Rp 100.000" />
                    <Input label="Tunjangan Lain-lain" name="misc_allowance" value={employmentTermsForm.misc_allowance ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, misc_allowance: e.target.value }))} placeholder="e.g. Rp 0" />
                    <Input label="BPJS Kesehatan" name="bpjs_kes" value={employmentTermsForm.bpjs_kes ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, bpjs_kes: e.target.value }))} placeholder="Nomor atau nilai" />
                    <Input label="BPJS Ketenagakerjaan" name="bpjs_tku" value={employmentTermsForm.bpjs_tku ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, bpjs_tku: e.target.value }))} placeholder="Nomor atau nilai" />
                    <Input label="BPJS BPU" name="bpjs_bpu" value={employmentTermsForm.bpjs_bpu ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, bpjs_bpu: e.target.value }))} placeholder="Nomor atau nilai" />
                    <Input label="Asuransi (Provider)" name="insurance_provider" value={employmentTermsForm.insurance_provider ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, insurance_provider: e.target.value }))} placeholder="Nama provider" />
                    <Input label="Nomor Polis Asuransi" name="insurance_no" value={employmentTermsForm.insurance_no ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, insurance_no: e.target.value }))} placeholder="Nomor polis" />
                    <Input label="Lembur (Nominal)" name="overtime_nominal" value={employmentTermsForm.overtime_nominal ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, overtime_nominal: e.target.value }))} placeholder="e.g. Rp 25.000/jam" />
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
                    { label: 'Salary', value: onboardingData?.employment_salary },
                    { label: 'Tunjangan Jabatan', value: onboardingData?.employment_positional_allowance },
                    { label: 'Tunjangan Transportasi', value: onboardingData?.employment_transport_allowance },
                    { label: 'Tunjangan Komunikasi', value: onboardingData?.employment_comm_allowance },
                    { label: 'Tunjangan Lain-lain', value: onboardingData?.employment_misc_allowance },
                    { label: 'BPJS Kesehatan', value: onboardingData?.employment_bpjs_kes },
                    { label: 'BPJS Ketenagakerjaan', value: onboardingData?.employment_bpjs_tku },
                    { label: 'BPJS BPU', value: onboardingData?.employment_bpjs_bpu },
                    { label: 'Asuransi (Provider)', value: onboardingData?.employment_insurance_provider },
                    { label: 'Nomor Polis', value: onboardingData?.employment_insurance_no },
                    { label: 'Lembur (Nominal)', value: onboardingData?.employment_overtime_nominal, full: true },
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

        {isOnboardingRelevant && !candidate.ojt_option && (
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

                {formLinkUrl && (
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
                    {onboardingData?.hrd_rejected_at ? (
                      <>
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                          <p className="text-xs text-amber-700 font-bold">HRD rejected the previous request</p>
                          {onboardingData.hrd_comment && (
                            <p className="text-xs text-amber-600 mt-2">{onboardingData.hrd_comment}</p>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">You can fix any issues and request a contract from HRD again.</p>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100 mb-4">
                          <p className="text-xs text-green-700 font-bold">✓ Onboarding Form Submitted</p>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">Candidate has provided all required information. You can now request a contract from HRD.</p>
                      </>
                    )}
                    <Button
                      onClick={() => setShowConfirmHrd(true)}
                      disabled={submitHrdLoading}
                      className="w-full !bg-amber-500 hover:!bg-amber-600"
                    >
                      {submitHrdLoading ? 'Requesting...' : 'Request Contract'}
                    </Button>
                  </div>
                )}

                {contractRequestedWaitingHrd && (
                  <div className="space-y-4 text-center py-8">
                    <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-brand-dark font-headline">Contract Requested</h4>
                    <p className="text-xs text-slate-500">Waiting for HRD to generate and send the contract.</p>
                    
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
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
    </div>
  );
}

function buildFullKtpAddress(data: Record<string, string>): string {
  const parts: string[] = [];
  if (data.ktp_rt_rw?.trim()) parts.push(`RT/RW ${data.ktp_rt_rw.trim()}`);
  if (data.address?.trim()) parts.push(data.address.trim());
  if (data.ktp_sub_district?.trim()) parts.push(data.ktp_sub_district.trim());
  if (data.ktp_district?.trim()) parts.push(data.ktp_district.trim());
  if (data.ktp_province?.trim()) parts.push(data.ktp_province.trim());
  return parts.join(', ');
}

function buildFullKtpAddressFromForm(d: api.OnboardingFormData | null): string {
  if (!d) return '';
  const parts: string[] = [];
  if (d.ktp_rt_rw?.trim()) parts.push(`RT/RW ${d.ktp_rt_rw.trim()}`);
  if (d.address?.trim()) parts.push(d.address.trim());
  if (d.ktp_sub_district?.trim()) parts.push(d.ktp_sub_district.trim());
  if (d.ktp_district?.trim()) parts.push(d.ktp_district.trim());
  if (d.ktp_province?.trim()) parts.push(d.ktp_province.trim());
  return parts.length > 0 ? parts.join(', ') : (d.address ?? '');
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
    <>
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
                ktp_rt_rw: onboardingData.ktp_rt_rw ?? '',
                ktp_province: onboardingData.ktp_province ?? '',
                ktp_district: onboardingData.ktp_district ?? '',
                ktp_sub_district: onboardingData.ktp_sub_district ?? '',
                address: onboardingData.address ?? '',
                domicile_address: onboardingData.domicile_address ?? '',
                domicile_same_as_ktp: onboardingData.domicile_same_as_ktp ? '1' : '0',
                place_of_birth: onboardingData.place_of_birth ?? '',
                date_of_birth: onboardingData.date_of_birth ?? '',
                gender: onboardingData.gender ?? 'male',
                religion: onboardingData.religion ?? '',
                marital_status: (onboardingData.marital_status === 'menikah' ? 'married' : onboardingData.marital_status) ?? 'single',
                phone_no: onboardingData.phone_no ?? '',
                child_number: onboardingData.child_number != null ? String(onboardingData.child_number) : '',
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
                const payload: api.OnboardingFormDataEditable = {
                  id_number: onboardingEditForm.id_number || undefined,
                  ktp_rt_rw: onboardingEditForm.ktp_rt_rw || undefined,
                  ktp_province: onboardingEditForm.ktp_province || undefined,
                  ktp_district: onboardingEditForm.ktp_district || undefined,
                  ktp_sub_district: onboardingEditForm.ktp_sub_district || undefined,
                  address: onboardingEditForm.address || undefined,
                  domicile_address: onboardingEditForm.domicile_address || undefined,
                  domicile_same_as_ktp: onboardingEditForm.domicile_same_as_ktp === '1',
                  place_of_birth: onboardingEditForm.place_of_birth || undefined,
                  date_of_birth: onboardingEditForm.date_of_birth || undefined,
                  gender: onboardingEditForm.gender || undefined,
                  religion: onboardingEditForm.religion || undefined,
                  marital_status: onboardingEditForm.marital_status || undefined,
                  phone_no: onboardingEditForm.phone_no || undefined,
                  child_number: onboardingEditForm.child_number !== '' ? (parseInt(onboardingEditForm.child_number, 10) || undefined) : undefined,
                  bank_name: onboardingEditForm.bank_name || undefined,
                  bank_account_number: onboardingEditForm.bank_account_number || undefined,
                  bank_account_holder: onboardingEditForm.bank_account_holder || undefined,
                  npwp_number: onboardingEditForm.npwp_number || undefined,
                  emergency_contact_name: onboardingEditForm.emergency_contact_name || undefined,
                  emergency_contact_relationship: onboardingEditForm.emergency_contact_relationship || undefined,
                  emergency_contact_phone: onboardingEditForm.emergency_contact_phone || undefined,
                };
                const updated = await api.updateOnboardingFormByCandidate(candidateId, payload);
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
              <Input label="Phone Number" name="phone_no" value={onboardingEditForm.phone_no ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, phone_no: e.target.value }))} placeholder="+62..." />
              <Input label="Place of Birth" name="place_of_birth" value={onboardingEditForm.place_of_birth ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, place_of_birth: e.target.value }))} placeholder="City" />
              <Input label="Date of Birth" name="date_of_birth" type="date" value={onboardingEditForm.date_of_birth ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, date_of_birth: e.target.value }))} />
              <Select label="Gender" name="gender" value={onboardingEditForm.gender ?? 'male'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOnboardingEditForm((p) => ({ ...p, gender: e.target.value }))}>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </Select>
              <Input label="Religion" name="religion" value={onboardingEditForm.religion ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, religion: e.target.value }))} placeholder="e.g. Islam, Christian" />
              <Select label="Marital Status" name="marital_status" value={onboardingEditForm.marital_status ?? 'single'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOnboardingEditForm((p) => ({ ...p, marital_status: e.target.value }))}>
                <option value="single">Lajang</option>
                <option value="married">Menikah</option>
                <option value="divorced">Cerai</option>
              </Select>
              {(onboardingEditForm.marital_status === 'married' || onboardingEditForm.marital_status === 'menikah') && (
                <Input label="Jumlah Anak" name="child_number" type="number" min="0" value={onboardingEditForm.child_number ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, child_number: e.target.value }))} placeholder="0" />
              )}
              <Input label="NPWP Number" name="npwp_number" value={onboardingEditForm.npwp_number ?? ''} onChange={(e) => setOnboardingEditForm((p) => ({ ...p, npwp_number: e.target.value }))} placeholder="Tax ID (optional)" />
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="RT/RW" name="ktp_rt_rw" value={onboardingEditForm.ktp_rt_rw ?? ''} onChange={(e) => setOnboardingEditForm((p) => {
                  const next = { ...p, ktp_rt_rw: e.target.value };
                  return p.domicile_same_as_ktp === '1' ? { ...next, domicile_address: buildFullKtpAddress(next) } : next;
                })} placeholder="01/02" />
                <Input label="Provinsi" name="ktp_province" value={onboardingEditForm.ktp_province ?? ''} onChange={(e) => setOnboardingEditForm((p) => {
                  const next = { ...p, ktp_province: e.target.value };
                  return p.domicile_same_as_ktp === '1' ? { ...next, domicile_address: buildFullKtpAddress(next) } : next;
                })} placeholder="Provinsi" />
                <Input label="Kabupaten/Kota" name="ktp_district" value={onboardingEditForm.ktp_district ?? ''} onChange={(e) => setOnboardingEditForm((p) => {
                  const next = { ...p, ktp_district: e.target.value };
                  return p.domicile_same_as_ktp === '1' ? { ...next, domicile_address: buildFullKtpAddress(next) } : next;
                })} placeholder="Kabupaten atau Kota" />
                <Input label="Kecamatan" name="ktp_sub_district" value={onboardingEditForm.ktp_sub_district ?? ''} onChange={(e) => setOnboardingEditForm((p) => {
                  const next = { ...p, ktp_sub_district: e.target.value };
                  return p.domicile_same_as_ktp === '1' ? { ...next, domicile_address: buildFullKtpAddress(next) } : next;
                })} placeholder="Kecamatan" />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Alamat (Jalan, Nomor)" name="address" value={onboardingEditForm.address ?? ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOnboardingEditForm((p) => {
                  const next = { ...p, address: e.target.value };
                  return p.domicile_same_as_ktp === '1' ? { ...next, domicile_address: buildFullKtpAddress(next) } : next;
                })} rows={3} placeholder="Alamat lengkap sesuai KTP..." />
              </div>
              <div className="md:col-span-2 flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onboardingEditForm.domicile_same_as_ktp === '1'}
                    onChange={(e) => setOnboardingEditForm((p) => {
                      const next = { ...p, domicile_same_as_ktp: e.target.checked ? '1' : '0' };
                      return e.target.checked ? { ...next, domicile_address: buildFullKtpAddress(p) } : next;
                    })}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <span className="text-sm font-medium text-slate-700">Alamat domisili sama dengan alamat KTP</span>
                </label>
                <Textarea label="Alamat Domisili" name="domicile_address" value={onboardingEditForm.domicile_address ?? ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOnboardingEditForm((p) => ({ ...p, domicile_address: e.target.value }))} rows={3} placeholder="Alamat domisili saat ini (jika berbeda dari KTP)..." disabled={onboardingEditForm.domicile_same_as_ktp === '1'} />
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
                { label: 'Phone Number', value: onboardingData.phone_no },
                { label: 'Place of Birth', value: onboardingData.place_of_birth },
                { label: 'Date of Birth', value: onboardingData.date_of_birth },
                { label: 'Gender', value: formatGender(onboardingData.gender) },
                { label: 'Religion', value: onboardingData.religion },
                { label: 'Marital Status', value: onboardingData.marital_status },
                { label: 'Jumlah Anak', value: (onboardingData.marital_status === 'married' || onboardingData.marital_status === 'menikah') && onboardingData.child_number != null ? String(onboardingData.child_number) : null },
                { label: 'Alamat KTP', value: buildFullKtpAddressFromForm(onboardingData) || onboardingData.address, full: true },
                { label: 'Alamat Domisili', value: onboardingData.domicile_same_as_ktp ? (buildFullKtpAddressFromForm(onboardingData) || onboardingData.address) : onboardingData.domicile_address, full: true },
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

    {onboardingData?.declaration_checklist && typeof onboardingData.declaration_checklist === 'object' && (
      <Card className="mt-8">
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">Declaration List</h3>
        </CardHeader>
        <CardBody className="space-y-8">
          <div>
            <h4 className="text-xs font-bold text-brand uppercase tracking-wider mb-4">KETENTUAN</h4>
            <ul className="space-y-3">
              {(onboardingData.declaration_checklist as api.DeclarationChecklistData).ketentuan?.map((item, idx) => (
                <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className={`shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${item.checked ? 'bg-green-100 border-green-300 text-green-600' : 'bg-slate-100 border-slate-200'}`}>
                    {item.checked ? '✓' : '—'}
                  </span>
                  <div className="min-w-0">
                    <span><span className="font-medium">{idx + 1}. </span>{item.text}</span>
                    {item.subItems && (
                      <ul className="mt-2 ml-4 list-disc space-y-1 text-slate-600">
                        {item.subItems.map((sub, i) => (
                          <li key={i}>{sub}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-brand uppercase tracking-wider mb-4">SANKSI</h4>
            <ul className="space-y-3">
              {(onboardingData.declaration_checklist as api.DeclarationChecklistData).sanksi?.map((item, idx) => (
                <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className={`shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${item.checked ? 'bg-green-100 border-green-300 text-green-600' : 'bg-slate-100 border-slate-200'}`}>
                    {item.checked ? '✓' : '—'}
                  </span>
                  <span><span className="font-medium">{idx + 1}. </span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-start gap-2 text-sm text-slate-700">
              <span className={`shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${(onboardingData.declaration_checklist as api.DeclarationChecklistData).finalDeclaration?.checked ? 'bg-green-100 border-green-300 text-green-600' : 'bg-slate-100 border-slate-200'}`}>
                {(onboardingData.declaration_checklist as api.DeclarationChecklistData).finalDeclaration?.checked ? '✓' : '—'}
              </span>
              <span>{(onboardingData.declaration_checklist as api.DeclarationChecklistData).finalDeclaration?.text}</span>
            </div>
          </div>
        </CardBody>
      </Card>
    )}
  </>
  );
}

// Document type options for upload (matches backend CandidateDocumentType)
const CANDIDATE_DOCUMENT_TYPES: { value: api.CandidateDocumentType; label: string }[] = [
  { value: 'cv', label: 'CV / Resume' },
  { value: 'ktp', label: 'KTP (ID Card)' },
  { value: 'kk', label: 'Kartu Keluarga (KK)' },
  { value: 'skck', label: 'SKCK' },
  { value: 'other', label: 'Other' },
];

function formatDocumentType(t: string): string {
  return CANDIDATE_DOCUMENT_TYPES.find((o) => o.value === t)?.label ?? t;
}

// Documents Tab Component
const MAX_CANDIDATE_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

function DocumentsTab({
  candidateId,
  documents,
  uploading,
  canUpload,
  canDelete,
  onUpload,
  onDownload,
  onDelete,
}: {
  candidateId: number;
  documents: CandidateDocument[];
  uploading: boolean;
  canUpload: boolean;
  canDelete: boolean;
  onUpload: (file: File, documentType: api.CandidateDocumentType) => void;
  onDownload: (docId: number) => void;
  onDelete: (docId: number) => void;
}) {
  const [uploadType, setUploadType] = useState<api.CandidateDocumentType>('cv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setFileSizeError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_CANDIDATE_DOCUMENT_SIZE) {
      setSelectedFile(null);
      setFileSizeError('File must be 5MB or less.');
      toast.error('File must be 5MB or less.');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmitUpload = async () => {
    if (!selectedFile) return;
    if (selectedFile.size > MAX_CANDIDATE_DOCUMENT_SIZE) {
      toast.error('File must be 5MB or less.');
      return;
    }
    onUpload(selectedFile, uploadType);
    setSelectedFile(null);
    setFileSizeError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Upload section (only for users with candidate:upload_doc) */}
      {canUpload ? (
        <Card>
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Upload document
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Choose the document type and file to upload for this candidate.
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Document type</label>
                <Select
                  value={uploadType}
                  onChange={(e) => setUploadType((e.target.value || 'cv') as api.CandidateDocumentType)}
                  className="w-full"
                >
                  {CANDIDATE_DOCUMENT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">File</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {selectedFile && (
                    <span className="text-sm text-slate-600 font-medium truncate max-w-[200px]" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Max size: 5MB</p>
                {fileSizeError && (
                  <p className="text-xs text-red-600 font-medium mt-1">{fileSizeError}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Button
                onClick={handleSubmitUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload document'}
              </Button>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Clear selection
                </button>
              )}
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* Uploaded documents list */}
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Uploaded documents
          </h3>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Document type</TH>
              <TH>File name</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {documents.length === 0 ? (
              <TR>
                <TD colSpan={3} className="py-8 text-center text-slate-400">
                  No documents uploaded yet. Use the form above to add a document.
                </TD>
              </TR>
            ) : (
              documents.map((doc) => (
                <TR key={doc.id}>
                  <TD className="font-medium text-slate-700">{formatDocumentType(doc.type)}</TD>
                  <TD className="text-sm text-slate-600">{doc.file_name}</TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onDownload(doc.id)}
                        className="p-2 text-slate-400 hover:text-brand transition-colors"
                        title="Download"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {canDelete && (
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
                            setDeletingId(doc.id);
                            try {
                              await onDelete(doc.id);
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId === doc.id}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === doc.id ? (
                            <span className="inline-block w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4m1 4h.01M12 4h.01M17 4v1a1 1 0 01-1 1H8a1 1 0 01-1-1V4" />
                            </svg>
                          )}
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
    </div>
  );
}
