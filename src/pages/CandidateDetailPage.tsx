import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { Select } from '../components/Select';
import { ConfirmModal } from '../components/Modal';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Candidate, CandidateDocument } from '../services/api';
import * as api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { downloadFromUrl } from '../utils/download.ts';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { formatGender } from '../utils/formatGender';
import { mergeCandidateFromApiResponse } from '../utils/mergeCandidate';

type TabType = 'overview' | 'onboarding' | 'documents';

function toDateInputValue(iso?: string | null): string {
  if (iso == null || String(iso).trim() === '') return '';
  const t = new Date(String(iso));
  if (Number.isNaN(t.getTime())) return '';
  return t.toISOString().slice(0, 10);
}

/** Href for pasted CV links; adds https if scheme is missing. */
function toExternalHref(raw: string): string {
  const t = raw.trim();
  if (!t) return '#';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function isHttpUrl(s: string | undefined | null): boolean {
  if (s == null || !String(s).trim()) return false;
  const t = String(s).trim().toLowerCase();
  return t.startsWith('http://') || t.startsWith('https://');
}

const PACKAGE_OPTIONS: { key: string; label: string }[] = [
  { key: 'bpjskes', label: 'BPJS Kesehatan' },
  { key: 'bpjsket', label: 'BPJS Ketenagakerjaan' },
  { key: 'bpjsbpu', label: 'BPJS BPU' },
  { key: 'insurance', label: 'Asuransi' },
  { key: 'overtime', label: 'Lembur' },
];
function defaultPackagesForEmploymentType(t: api.CandidateEmploymentType | null): string[] {
  if (t === 'pkwt') return ['bpjskes', 'bpjsket'];
  if (t === 'partnership') return ['bpjsbpu'];
  return [];
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    province_id?: string;
    district_id?: string;
    sub_district_id?: string;
    village_id?: string;
    branch?: string;
    cv_url?: string;
  }>({});
  const [employmentTermsSaveLoading, setEmploymentTermsSaveLoading] = useState(false);
  const [packageKeys, setPackageKeys] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const toast = useToast();
  const { permissions = [] } = useAuth();

  const candidateId = id ? parseInt(id, 10) : 0;
  const candidateReturnTo = id ? `/candidates/${id}` : '';
  const canEditCandidate = permissions.includes('candidate:update');
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

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreview = async (docId: number) => {
    const doc = documents.find((d) => d.id === docId);
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewUrl(null);
    setPreviewTitle(doc ? `${formatDocumentType(doc.type)} - ${doc.file_name}` : `Document #${docId}`);
    try {
      const url = await api.getCandidateDocumentUrl(candidateId, docId);
      setPreviewUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load document');
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
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
      setCandidate((prev) =>
        mergeCandidateFromApiResponse(prev, updated, { screeningStatusFallback: 'submitted' }),
      );
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

  const now = new Date();
  const hasActiveOnboardingLink =
    onboardingLink != null &&
    new Date(onboardingLink.expires_at) > now &&
    !onboardingLink.used_at;

  const formLinkUrl = hasActiveOnboardingLink
    ? `${window.location.origin}/onboarding/${onboardingLink!.token}`
    : null;

  const showGenerateLink =
    candidate.screening_status === 'interview_passed' ||
    (candidate.screening_status === 'onboarding' && !hasActiveOnboardingLink);
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
  const isOjtStatus = (candidate.screening_status ?? '').trim().toLowerCase() === 'ojt';

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-body">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand transition-colors"
        >
          <span aria-hidden>←</span>
          Back
        </button>
      </div>
      <PageHeader
        title={candidate.full_name}
        subtitle={candidate.email}
        actions={
          canEditCandidate ? (
            <ButtonLink
              to={candidateReturnTo ? `/candidates/${candidate.id}/edit?return=${encodeURIComponent(candidateReturnTo)}` : `/candidates/${candidate.id}/edit`}
              variant="secondary"
            >
              Edit Profile
            </ButtonLink>
          ) : undefined
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
            packageKeys={packageKeys}
            setPackageKeys={setPackageKeys}
            setCandidate={setCandidate}
            setDocuments={setDocuments}
            documents={documents}
            isOjtStatus={isOjtStatus}
            canActOnCandidate={canEditCandidate}
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
            onPreview={handlePreview}
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
  packageKeys,
  setPackageKeys,
  setCandidate,
  setDocuments,
  documents,
  isOjtStatus,
  canActOnCandidate,
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
    province_id?: string;
    district_id?: string;
    sub_district_id?: string;
    village_id?: string;
    branch?: string;
    cv_url?: string;
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
    province_id?: string;
    district_id?: string;
    sub_district_id?: string;
    village_id?: string;
    branch?: string;
    cv_url?: string;
  }>>;
  employmentTermsSaveLoading: boolean;
  setEmploymentTermsSaveLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setOnboardingData: React.Dispatch<React.SetStateAction<api.OnboardingFormData | null>>;
  packageKeys: string[];
  setPackageKeys: React.Dispatch<React.SetStateAction<string[]>>;
  setCandidate: React.Dispatch<React.SetStateAction<Candidate | null>>;
  setDocuments: React.Dispatch<React.SetStateAction<CandidateDocument[]>>;
  documents: CandidateDocument[];
  isOjtStatus: boolean;
  canActOnCandidate: boolean;
  toast: ReturnType<typeof useToast>;
}) {
  const [subDistrictOptions, setSubDistrictOptions] = useState<api.RegionItem[]>([]);
  const [villageOptions, setVillageOptions] = useState<api.RegionItem[]>([]);
  const [districtOptions, setDistrictOptions] = useState<api.RegionItem[]>([]);
  const [regionProvinces, setRegionProvinces] = useState<api.RegionItem[]>([]);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [subDistrictSearch, setSubDistrictSearch] = useState('');
  const [subDistrictDropdownOpen, setSubDistrictDropdownOpen] = useState(false);
  const [villageSearch, setVillageSearch] = useState('');
  const [villageDropdownOpen, setVillageDropdownOpen] = useState(false);
  const [rejectOjtOpen, setRejectOjtOpen] = useState(false);
  const [rejectOjtLoading, setRejectOjtLoading] = useState(false);
  const [rejectOjtForm, setRejectOjtForm] = useState<{
    ojt_start_date: string;
    ojt_end_date: string;
    bank_name: string;
    bank_account_number: string;
    bank_account_holder: string;
  }>({
    ojt_start_date: '',
    ojt_end_date: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
  });

  const selectedProvinceId = (editingEmploymentTerms ? employmentTermsForm.province_id : candidate.province_id)?.trim();
  const selectedDistrictId = (editingEmploymentTerms ? employmentTermsForm.district_id : candidate.district_id)?.trim();
  const selectedSubDistrictId = (editingEmploymentTerms ? employmentTermsForm.sub_district_id : candidate.sub_district_id)?.trim();

  useEffect(() => {
    api
      .getRegionsProvinces()
      .then((list) => setRegionProvinces(list))
      .catch(() => setRegionProvinces([]));
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) {
      setDistrictOptions([]);
      return;
    }
    api
      .getRegionsDistricts(selectedProvinceId)
      .then((list) => setDistrictOptions(list))
      .catch(() => setDistrictOptions([]));
  }, [selectedProvinceId]);

  useEffect(() => {
    const districtId = selectedDistrictId;
    if (!districtId) {
      setSubDistrictOptions([]);
      return;
    }
    api
      .getRegionsSubDistricts(districtId)
      .then((list) => setSubDistrictOptions(list))
      .catch(() => setSubDistrictOptions([]));
  }, [selectedDistrictId]);

  useEffect(() => {
    if (!selectedSubDistrictId) {
      setVillageOptions([]);
      return;
    }
    api
      .getRegionsVillages(selectedSubDistrictId)
      .then((list) => setVillageOptions(list))
      .catch(() => setVillageOptions([]));
  }, [selectedSubDistrictId]);

  const selectedSubDistrictName =
    subDistrictOptions.find((s) => s.id === candidate.sub_district_id)?.name ?? candidate.sub_district_id;
  const selectedVillageName =
    villageOptions.find((v) => v.id === candidate.village_id)?.name ?? candidate.village_id;
  const selectedFormProvinceName =
    regionProvinces.find((p) => p.id === (employmentTermsForm.province_id ?? ''))?.name ?? '';
  const selectedFormDistrictName =
    districtOptions.find((d) => d.id === (employmentTermsForm.district_id ?? ''))?.name ?? '';
  const selectedFormSubDistrictName =
    subDistrictOptions.find((s) => s.id === (employmentTermsForm.sub_district_id ?? ''))?.name ?? '';
  const selectedFormVillageName =
    villageOptions.find((v) => v.id === (employmentTermsForm.village_id ?? ''))?.name ?? '';
  const normalizedScreeningStatus = (candidate.screening_status ?? '').trim().toLowerCase();
  // Some legacy records may have an empty status. Treat as submitted so recruiter actions remain usable.
  const screeningStatusForFlow = normalizedScreeningStatus || 'submitted';

  const openRejectOjtPanel = () => {
    setRejectOjtForm({
      ojt_start_date: toDateInputValue(candidate.ojt_start_date) || '',
      ojt_end_date: toDateInputValue(candidate.ojt_end_date) || '',
      bank_name: onboardingData?.bank_name?.trim() ?? '',
      bank_account_number: onboardingData?.bank_account_number?.trim() ?? '',
      bank_account_holder: onboardingData?.bank_account_holder?.trim() ?? '',
    });
    setRejectOjtOpen(true);
  };

  const handleRejectOjtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectOjtForm.ojt_start_date || !rejectOjtForm.ojt_end_date) {
      toast.error('OJT start and end dates are required');
      return;
    }
    setRejectOjtLoading(true);
    try {
      const updated = await api.rejectOjtCandidate(candidateId, {
        ojt_start_date: rejectOjtForm.ojt_start_date,
        ojt_end_date: rejectOjtForm.ojt_end_date,
        bank_name: rejectOjtForm.bank_name || undefined,
        bank_account_number: rejectOjtForm.bank_account_number || undefined,
        bank_account_holder: rejectOjtForm.bank_account_holder || undefined,
      });
      setCandidate((prev) => mergeCandidateFromApiResponse(prev, updated, { screeningStatusFallback: 'rejected' }));
      setRejectOjtOpen(false);
      toast.success('Candidate rejected. OJT dates and bank details have been saved.');
      try {
        const fresh = await api.getOnboardingFormByCandidate(candidateId);
        setOnboardingData(fresh);
      } catch {
        // ignore
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setRejectOjtLoading(false);
    }
  };

  return (
    <>
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
                  screeningStatusForFlow === 'hired' ? 'bg-green-100 text-green-700' :
                  screeningStatusForFlow === 'rejected' ? 'bg-red-100 text-red-700' :
                  screeningStatusForFlow === 'contract_requested' ? 'bg-amber-100 text-amber-700' :
                  screeningStatusForFlow === 'ojt' ? 'bg-teal-100 text-teal-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {screeningStatusForFlow.replace(/_/g, ' ')}
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Position</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.position ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Placement Location</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.placement_location ?? '—'}</p>
              </div>
              {candidate.screening_rating != null && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Screening Rating</p>
                  <p className="text-sm font-bold text-brand-dark">{candidate.screening_rating}</p>
                </div>
              )}
              {candidate.submitted_to_client_at && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Submitted to Client</p>
                  <p className="text-sm font-bold text-brand-dark">{formatDate(candidate.submitted_to_client_at, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Created At</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.created_at ? formatDate(candidate.created_at, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Updated At</p>
                <p className="text-sm font-bold text-brand-dark">{candidate.updated_at ? formatDate(candidate.updated_at, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
              </div>
              <div className={isOnboardingRelevant ? 'col-span-2 flex gap-3 pt-4 border-t border-slate-50' : 'col-span-3 flex gap-3 pt-4 border-t border-slate-50'}>
                {screeningStatusForFlow === 'screened_pass' && (
                  <Button 
                    onClick={handleSubmitToClient} 
                    className="!py-2 !text-xs"
                    disabled={submitToClientLoading}
                  >
                    {submitToClientLoading ? 'Submitting...' : 'Submit to Client'}
                  </Button>
                )}
                {(screeningStatusForFlow === 'submitted' || screeningStatusForFlow === 'interview_scheduled') && (
                  <>
                    <Button onClick={() => handleStatusUpdate('interview_passed')} className="!py-2 !text-xs">
                      Mark Interview Passed
                    </Button>
                    <Button onClick={() => handleStatusUpdate('interview_failed')} variant="ghost" className="!py-2 !text-xs !text-red-500 hover:!bg-red-50">
                      Mark Interview Failed
                    </Button>
                  </>
                )}
                {screeningStatusForFlow === 'screening' && (
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

          {/* Employment Terms (filled by recruiter) — hidden for rejected candidates */}
          {screeningStatusForFlow !== 'rejected' && (
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
                      cv_url: (() => {
                        const cv = documents.find((d) => d.type === 'cv');
                        return cv && isHttpUrl(cv.file_path) ? cv.file_path : '';
                      })(),
                      province_id: candidate.province_id ?? '',
                      district_id: candidate.district_id ?? '',
                      sub_district_id: candidate.sub_district_id ?? '',
                      village_id: candidate.village_id ?? '',
                      branch: candidate.branch ?? '',
                    });
                    const packageStr = onboardingData?.package ?? candidate?.package;
                    const fromCandidate = packageStr ? packageStr.split(',').map((s) => s.trim()).filter(Boolean) : [];
                    setPackageKeys(fromCandidate.length ? fromCandidate : defaultPackagesForEmploymentType(candidate?.employment_type ?? null));
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
                    if (!employmentTermsForm.start_date || !employmentTermsForm.duration_months || !employmentTermsForm.salary?.trim() || !employmentTermsForm.province_id || !employmentTermsForm.district_id || !employmentTermsForm.sub_district_id || !employmentTermsForm.village_id) {
                      toast.error('Start Date, Duration (Months), Salary, Province, District, Sub-district, and Village are required.');
                      return;
                    }
                    setEmploymentTermsSaveLoading(true);
                    try {
                      // Candidate update requires candidate:update; run it first so we never persist onboarding-only
                      // changes when the user lacks permission (employment-terms API enforces the same permission).
                      const updatedCandidate = await api.updateCandidate(candidateId, {
                        package: packageKeys.length ? packageKeys.join(',') : undefined,
                        province_id: employmentTermsForm.province_id || undefined,
                        district_id: employmentTermsForm.district_id || undefined,
                        sub_district_id: employmentTermsForm.sub_district_id || undefined,
                        village_id: employmentTermsForm.village_id || undefined,
                        branch: employmentTermsForm.branch || undefined,
                      });
                      const updatedOnboarding = await api.updateEmploymentTerms(candidateId, {
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

                      setOnboardingData(updatedOnboarding);
                      if (updatedCandidate) {
                        setCandidate((prev) => mergeCandidateFromApiResponse(prev, updatedCandidate));
                      }
                      const cvDoc = documents.find((d) => d.type === 'cv');
                      const hadOnlyFile = Boolean(cvDoc && !isHttpUrl(cvDoc.file_path));
                      const newCv = (employmentTermsForm.cv_url ?? '').trim();
                      if (!(hadOnlyFile && newCv === '')) {
                        await api.setCandidateCvLink(candidateId, newCv);
                      }
                      setDocuments(await api.getCandidateDocuments(candidateId));
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
                      required
                    />
                    <Input
                      label="Contract Duration (Months)"
                      name="duration_months"
                      type="number"
                      min="1"
                      value={employmentTermsForm.duration_months ?? ''}
                      onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, duration_months: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                      placeholder="e.g. 12"
                      required
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Salary"
                        name="salary"
                        value={employmentTermsForm.salary ?? ''}
                        onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, salary: e.target.value }))}
                        placeholder="e.g. Rp 5.000.000"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-headline">Packages</p>
                      <div className="flex flex-col gap-2">
                        {PACKAGE_OPTIONS.map((opt) => (
                          <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={packageKeys.includes(opt.key)}
                              onChange={() => {
                                setPackageKeys((prev) =>
                                  prev.includes(opt.key) ? prev.filter((k) => k !== opt.key) : [...prev, opt.key]
                                );
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                            />
                            <span className="text-sm text-slate-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Input label="Tunjangan Jabatan" name="positional_allowance" value={employmentTermsForm.positional_allowance ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, positional_allowance: e.target.value }))} placeholder="e.g. Rp 500.000" />
                    <Input label="Tunjangan Transportasi" name="transport_allowance" value={employmentTermsForm.transport_allowance ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, transport_allowance: e.target.value }))} placeholder="e.g. Rp 500.000" />
                    <Input label="Tunjangan Komunikasi" name="comm_allowance" value={employmentTermsForm.comm_allowance ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, comm_allowance: e.target.value }))} placeholder="e.g. Rp 100.000" />
                    <Input label="Tunjangan Lain-lain" name="misc_allowance" value={employmentTermsForm.misc_allowance ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, misc_allowance: e.target.value }))} placeholder="e.g. Rp 0" />
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Province
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={provinceDropdownOpen ? provinceSearch : selectedFormProvinceName}
                          onChange={(e) => {
                            setProvinceSearch(e.target.value);
                            if (!provinceDropdownOpen) setProvinceDropdownOpen(true);
                          }}
                          onFocus={() => {
                            setProvinceSearch(selectedFormProvinceName);
                            setProvinceDropdownOpen(true);
                          }}
                          onBlur={() => setTimeout(() => setProvinceDropdownOpen(false), 150)}
                          placeholder="Search or select province..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                        />
                        {provinceDropdownOpen && (
                          <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                            {regionProvinces
                              .filter((p) => !provinceSearch.trim() || p.name.toLowerCase().includes(provinceSearch.trim().toLowerCase()))
                              .slice(0, 50)
                              .map((p) => (
                                <li
                                  key={p.id}
                                  role="option"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setEmploymentTermsForm((prev) => ({
                                      ...prev,
                                      province_id: p.id,
                                      district_id: '',
                                      sub_district_id: '',
                                      village_id: '',
                                    }));
                                    setProvinceSearch('');
                                    setProvinceDropdownOpen(false);
                                  }}
                                  className="px-4 py-2 text-sm text-slate-800 hover:bg-brand/10 cursor-pointer"
                                >
                                  {p.name}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        District
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={districtDropdownOpen ? districtSearch : selectedFormDistrictName}
                          onChange={(e) => {
                            if (!employmentTermsForm.province_id) return;
                            setDistrictSearch(e.target.value);
                            if (!districtDropdownOpen) setDistrictDropdownOpen(true);
                          }}
                          onFocus={() => {
                            if (!employmentTermsForm.province_id) return;
                            setDistrictSearch(selectedFormDistrictName);
                            setDistrictDropdownOpen(true);
                          }}
                          onBlur={() => setTimeout(() => setDistrictDropdownOpen(false), 150)}
                          placeholder={employmentTermsForm.province_id ? 'Search or select district...' : 'Set province first'}
                          disabled={!employmentTermsForm.province_id}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {districtDropdownOpen && employmentTermsForm.province_id && (
                          <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                            {districtOptions
                              .filter((d) => !districtSearch.trim() || d.name.toLowerCase().includes(districtSearch.trim().toLowerCase()))
                              .slice(0, 50)
                              .map((d) => (
                                <li
                                  key={d.id}
                                  role="option"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setEmploymentTermsForm((prev) => ({
                                      ...prev,
                                      district_id: d.id,
                                      sub_district_id: '',
                                      village_id: '',
                                    }));
                                    setDistrictSearch('');
                                    setDistrictDropdownOpen(false);
                                  }}
                                  className="px-4 py-2 text-sm text-slate-800 hover:bg-brand/10 cursor-pointer"
                                >
                                  {d.name}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Sub-district
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={subDistrictDropdownOpen ? subDistrictSearch : selectedFormSubDistrictName}
                          onChange={(e) => {
                            if (!employmentTermsForm.district_id) return;
                            setSubDistrictSearch(e.target.value);
                            if (!subDistrictDropdownOpen) setSubDistrictDropdownOpen(true);
                          }}
                          onFocus={() => {
                            if (!employmentTermsForm.district_id) return;
                            setSubDistrictSearch(selectedFormSubDistrictName);
                            setSubDistrictDropdownOpen(true);
                          }}
                          onBlur={() => setTimeout(() => setSubDistrictDropdownOpen(false), 150)}
                          placeholder={employmentTermsForm.district_id ? 'Search or select sub-district...' : 'Set district first'}
                          disabled={!employmentTermsForm.district_id}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {subDistrictDropdownOpen && employmentTermsForm.district_id && (
                          <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                            {subDistrictOptions
                              .filter((s) => !subDistrictSearch.trim() || s.name.toLowerCase().includes(subDistrictSearch.trim().toLowerCase()))
                              .slice(0, 50)
                              .map((s) => (
                                <li
                                  key={s.id}
                                  role="option"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setEmploymentTermsForm((prev) => ({ ...prev, sub_district_id: s.id, village_id: '' }));
                                    setSubDistrictSearch('');
                                    setSubDistrictDropdownOpen(false);
                                  }}
                                  className="px-4 py-2 text-sm text-slate-800 hover:bg-brand/10 cursor-pointer"
                                >
                                  {s.name}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Village
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={villageDropdownOpen ? villageSearch : selectedFormVillageName}
                          onChange={(e) => {
                            if (!employmentTermsForm.sub_district_id) return;
                            setVillageSearch(e.target.value);
                            if (!villageDropdownOpen) setVillageDropdownOpen(true);
                          }}
                          onFocus={() => {
                            if (!employmentTermsForm.sub_district_id) return;
                            setVillageSearch(selectedFormVillageName);
                            setVillageDropdownOpen(true);
                          }}
                          onBlur={() => setTimeout(() => setVillageDropdownOpen(false), 150)}
                          placeholder={employmentTermsForm.sub_district_id ? 'Search or select village...' : 'Set sub-district first'}
                          disabled={!employmentTermsForm.sub_district_id}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {villageDropdownOpen && employmentTermsForm.sub_district_id && (
                          <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                            {villageOptions
                              .filter((v) => !villageSearch.trim() || v.name.toLowerCase().includes(villageSearch.trim().toLowerCase()))
                              .slice(0, 50)
                              .map((v) => (
                                <li
                                  key={v.id}
                                  role="option"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setEmploymentTermsForm((prev) => ({ ...prev, village_id: v.id }));
                                    setVillageSearch('');
                                    setVillageDropdownOpen(false);
                                  }}
                                  className="px-4 py-2 text-sm text-slate-800 hover:bg-brand/10 cursor-pointer"
                                >
                                  {v.name}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <Input label="Branch" name="branch" value={employmentTermsForm.branch ?? ''} onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, branch: e.target.value }))} placeholder="Branch name" />

                    <div className="md:col-span-2">
                      <Input
                        label="CV / resume (link)"
                        name="cv_url"
                        type="text"
                        value={employmentTermsForm.cv_url ?? ''}
                        onChange={(e) => setEmploymentTermsForm((p) => ({ ...p, cv_url: e.target.value }))}
                        placeholder="https://... or Drive / portfolio URL"
                        disabled={employmentTermsSaveLoading}
                      />
                      <p className="text-xs text-slate-500 mt-1.5">
                        Saved as the CV row in documents with the URL in file path. Leave empty to clear a link. If a CV file exists, leave this blank to keep the file, or paste a link to replace it.
                      </p>
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
                  <div className="md:col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">Packages</p>
                    {(onboardingData?.package ?? candidate?.package)?.trim() ? (
                      <ul className="text-sm text-brand-dark list-none space-y-1">
                        {(onboardingData?.package ?? candidate?.package ?? '').split(',').map((k) => k.trim()).filter(Boolean).map((key) => {
                          const opt = PACKAGE_OPTIONS.find((o) => o.key === key);
                          return opt ? <li key={key}>• {opt.label}</li> : <li key={key}>• {key}</li>;
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">—</p>
                    )}
                  </div>
                  {[
                    { label: 'Start Date', value: onboardingData?.employment_start_date, currency: false },
                    { label: 'Duration (Months)', value: onboardingData?.employment_duration_months ? `${onboardingData.employment_duration_months} months` : null, currency: false },
                    { label: 'Salary', value: onboardingData?.employment_salary, currency: true },
                    { label: 'Sub-district', value: selectedSubDistrictName, currency: false },
                    { label: 'Village', value: selectedVillageName, currency: false },
                    { label: 'Branch', value: candidate.branch, currency: false },
                    { label: 'Tunjangan Jabatan', value: onboardingData?.employment_positional_allowance, currency: true },
                    { label: 'Tunjangan Transportasi', value: onboardingData?.employment_transport_allowance, currency: true },
                    { label: 'Tunjangan Komunikasi', value: onboardingData?.employment_comm_allowance, currency: true },
                    { label: 'Tunjangan Lain-lain', value: onboardingData?.employment_misc_allowance, currency: true },
                  ].map((field, i) => (field.value != null && field.value !== '') ? (
                    <div key={i} className={(field as { full?: boolean }).full ? 'md:col-span-2' : ''}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">
                        {field.label}
                      </p>
                      <p className="text-sm font-bold text-brand-dark">
                        {field.currency ? formatCurrency(field.value as string) : field.value}
                      </p>
                    </div>
                  ) : null)}
                  {(() => {
                    const cv = documents.find((d) => d.type === 'cv');
                    if (!cv) return null;
                    if (isHttpUrl(cv.file_path)) {
                      return (
                        <div className="md:col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">CV / resume (link)</p>
                          <a
                            href={toExternalHref(cv.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-brand break-all hover:underline"
                          >
                            {cv.file_path.trim()}
                          </a>
                        </div>
                      );
                    }
                    return (
                      <div className="md:col-span-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">CV / resume</p>
                        <p className="text-sm text-slate-600">
                          File on record ({cv.file_name || 'file'}). Open it from the Documents tab.
                        </p>
                      </div>
                    );
                  })()}
                  {(!onboardingData?.employment_start_date && !onboardingData?.employment_duration_months && !onboardingData?.employment_salary) && (
                    <div className="md:col-span-2 text-center py-4 text-slate-400 text-sm">
                      No employment terms set yet. Click "Add" to set start date, duration, and salary.
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
          )}
        </div>

        {isOnboardingRelevant && (
          <div className="space-y-8">
            {isOjtStatus && showRequestContract && !onboardingData?.hrd_rejected_at && (
              <Card className="border-teal-200/80 bg-gradient-to-br from-teal-50/80 to-white border">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-teal-800 uppercase tracking-[0.2em] font-headline">OJT program</h3>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        The candidate is in <span className="font-semibold text-brand-dark">On the Job Training</span>. When OJT is complete, request a contract from HRD or record a rejection with the OJT period and bank details.
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4 pt-0">
                  <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700">
                    <li>Review employment terms and onboarding data on this page.</li>
                    <li>Request a contract to continue toward hire, or reject and archive the OJT window.</li>
                    <li>Rejecting requires OJT start/end dates; bank fields are saved to onboarding for payroll context.</li>
                  </ol>
                  {(candidate.ojt_start_date || candidate.ojt_end_date) && (
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 bg-white/60 rounded-lg px-3 py-2 border border-teal-100">
                      {candidate.ojt_start_date && (
                        <span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">OJT start (saved)</span>
                          {formatDate(candidate.ojt_start_date, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {candidate.ojt_end_date && (
                        <span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">OJT end (saved)</span>
                          {formatDate(candidate.ojt_end_date, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-3 pt-1">
                    <Button
                      type="button"
                      onClick={() => setShowConfirmHrd(true)}
                      disabled={submitHrdLoading || !canActOnCandidate}
                      className="w-full !py-3.5 !bg-amber-500 hover:!bg-amber-600"
                    >
                      {submitHrdLoading ? 'Requesting...' : 'Request contract'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full !py-3.5 !border-slate-200 !text-slate-800"
                      onClick={openRejectOjtPanel}
                      disabled={submitHrdLoading || !canActOnCandidate}
                    >
                      Reject candidate
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
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
                  <div className="space-y-4 py-4">
                    {onboardingData?.hrd_rejected_at ? (
                      <div className="text-center space-y-4">
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                          <p className="text-xs text-amber-700 font-bold">HRD rejected the previous request</p>
                          {onboardingData.hrd_comment && (
                            <p className="text-xs text-amber-600 mt-2">{onboardingData.hrd_comment}</p>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">You can fix any issues and request a contract from HRD again.</p>
                        <Button
                          onClick={() => setShowConfirmHrd(true)}
                          disabled={submitHrdLoading}
                          className="w-full max-w-md mx-auto !bg-amber-500 hover:!bg-amber-600"
                        >
                          {submitHrdLoading ? 'Requesting...' : 'Request Contract'}
                        </Button>
                      </div>
                    ) : isOjtStatus ? (
                      <p className="text-center text-sm text-slate-500 py-2">
                        Use the <span className="font-semibold text-slate-700">OJT program</span> card above for request contract and reject.
                      </p>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                          <p className="text-xs text-green-700 font-bold">✓ Onboarding Form Submitted</p>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">Candidate has provided all required information. You can now request a contract from HRD.</p>
                        <Button
                          onClick={() => setShowConfirmHrd(true)}
                          disabled={submitHrdLoading}
                          className="w-full max-w-md mx-auto !bg-amber-500 hover:!bg-amber-600"
                        >
                          {submitHrdLoading ? 'Requesting...' : 'Request Contract'}
                        </Button>
                      </div>
                    )}
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

                {screeningStatusForFlow === 'hired' && (
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

    {rejectOjtOpen && (
      <div className="fixed inset-0 z-[90] flex justify-end">
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
          aria-label="Close reject panel"
          onClick={() => !rejectOjtLoading && setRejectOjtOpen(false)}
        />
        <div
          className="relative h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-ojt-title"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 id="reject-ojt-title" className="text-sm font-bold text-brand-dark font-headline uppercase tracking-widest">
              Reject after OJT
            </h2>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1"
              disabled={rejectOjtLoading}
              onClick={() => setRejectOjtOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleRejectOjtSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <p className="text-sm text-slate-600">
              Record the OJT period and confirm payroll bank details. The candidate will be moved to <span className="font-semibold">rejected</span>.
            </p>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5" htmlFor="ojt_start">
                OJT start
              </label>
              <Input
                id="ojt_start"
                type="date"
                value={rejectOjtForm.ojt_start_date}
                onChange={(e) => setRejectOjtForm((p) => ({ ...p, ojt_start_date: e.target.value }))}
                required
                disabled={rejectOjtLoading || !canActOnCandidate}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5" htmlFor="ojt_end">
                OJT end
              </label>
              <Input
                id="ojt_end"
                type="date"
                value={rejectOjtForm.ojt_end_date}
                onChange={(e) => setRejectOjtForm((p) => ({ ...p, ojt_end_date: e.target.value }))}
                required
                disabled={rejectOjtLoading || !canActOnCandidate}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payroll bank (from onboarding)</p>
              <div className="space-y-3">
                <Input
                  label="Bank name"
                  name="bank_name"
                  value={rejectOjtForm.bank_name}
                  onChange={(e) => setRejectOjtForm((p) => ({ ...p, bank_name: e.target.value }))}
                  disabled={rejectOjtLoading || !canActOnCandidate}
                />
                <Input
                  label="Account number"
                  name="bank_account_number"
                  value={rejectOjtForm.bank_account_number}
                  onChange={(e) => setRejectOjtForm((p) => ({ ...p, bank_account_number: e.target.value }))}
                  disabled={rejectOjtLoading || !canActOnCandidate}
                />
                <Input
                  label="Account holder"
                  name="bank_account_holder"
                  value={rejectOjtForm.bank_account_holder}
                  onChange={(e) => setRejectOjtForm((p) => ({ ...p, bank_account_holder: e.target.value }))}
                  disabled={rejectOjtLoading || !canActOnCandidate}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" className="w-full" disabled={rejectOjtLoading || !canActOnCandidate}>
                {rejectOjtLoading ? 'Saving...' : 'Confirm reject'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={rejectOjtLoading}
                onClick={() => setRejectOjtOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
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

// Document type options for upload (CV is a link in Employment terms, not uploaded here)
const CANDIDATE_DOCUMENT_TYPES: { value: api.CandidateDocumentType; label: string }[] = [
  { value: 'ktp', label: 'KTP (ID Card)' },
  { value: 'kk', label: 'Kartu Keluarga (KK)' },
  { value: 'skck', label: 'SKCK' },
  { value: 'other', label: 'Other' },
];

function formatDocumentType(t: string): string {
  if (t === 'cv') return 'CV / Resume (file)';
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
  onPreview,
  onDelete,
}: {
  candidateId: number;
  documents: CandidateDocument[];
  uploading: boolean;
  canUpload: boolean;
  canDelete: boolean;
  onUpload: (file: File, documentType: api.CandidateDocumentType) => void;
  onDownload: (docId: number) => void;
  onPreview: (docId: number) => void;
  onDelete: (docId: number) => void;
}) {
  const [uploadType, setUploadType] = useState<api.CandidateDocumentType>('ktp');
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
              Choose the document type and file. For a CV, use the external link in Employment terms on the Overview tab instead of uploading a file.
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Document type</label>
                <Select
                  value={uploadType}
                  onChange={(e) => setUploadType((e.target.value || 'ktp') as api.CandidateDocumentType)}
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
                  No documents uploaded yet. Use the form above for KTP and other files; set the CV as a link under Employment terms.
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
                        onClick={() => onPreview(doc.id)}
                        className="p-2 text-slate-400 hover:text-brand transition-colors"
                        title="Preview"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
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
