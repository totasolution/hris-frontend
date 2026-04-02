import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import type { WarningLetter, Employee } from '../services/api';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function WarningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { t } = useTranslation(['pages', 'common']);
  const toast = useToast();
  const { permissions = [] } = useAuth();
  const canGenerateDocument = permissions.includes('warning:generate_document');
  const [warning, setWarning] = useState<WarningLetter | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [hasPreviewedWarning, setHasPreviewedWarning] = useState(false);

  const warningId = id ? parseInt(id, 10) : 0;
  const stateFrom = (location.state as { from?: string } | null)?.from;
  const fromMySpaceDocuments = stateFrom === 'me-documents';
  const fromMyWarnings = stateFrom === 'me';
  const backHref = fromMySpaceDocuments ? '/me/documents' : fromMyWarnings ? '/me/documents' : '/warnings';
  const backLabel = fromMySpaceDocuments ? t('pages:mySpace.documents') : fromMyWarnings ? t('pages:myWarnings.title') : t('pages:warnings.title');

  const load = async () => {
    if (!warningId) return;
    setLoading(true);
    setError(null);
    try {
      const w = await api.getWarning(warningId);
      setWarning(w);
      try {
        const emp = await api.getEmployee(w.employee_id);
        setEmployee(emp);
      } catch {
        setEmployee(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:warnings.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [warningId]);

  const handleDownload = async () => {
    if (!warning?.id) return;
    try {
      await api.downloadWarningDocument(warning.id);
    } catch {
      toast.error(t('pages:warnings.downloadFailed'));
    }
  };

  const openPreview = async (getUrl: () => Promise<string>, title: string) => {
    setPreviewOpen(true);
    setPreviewUrl(null);
    setPreviewTitle(title);
    setPreviewLoading(true);
    try {
      const url = await getUrl();
      setPreviewUrl(url);
    } catch {
      toast.error(t('pages:warnings.downloadFailed'));
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreview = () => {
    if (!warning?.id) return;
    openPreview(() => api.getWarningPresignedUrl(warning!.id), t('pages:warningDetail.warningLetter'))
      .then(() => {
        setHasPreviewedWarning(true);
      })
      .catch(() => {
        // errors are already handled inside openPreview
      });
  };

  const handlePreviewAttachment = (type: 'company_policy' | 'additional_reference') => {
    if (!warning?.id) return;
    const title = type === 'company_policy' ? t('pages:warningDetail.companyPolicy') : t('pages:warningDetail.additionalReference');
    openPreview(() => api.getWarningAttachmentPresignedUrl(warning!.id, type), title);
  };

  const handleRegenerate = async () => {
    if (!warning?.id) return;
    setRegenerating(true);
    try {
      const updated = await api.generateWarningDocument(warning.id);
      setWarning(updated);
      // If preview is currently open, refresh iframe src with a fresh presigned URL
      // so the user sees the newly regenerated PDF contents.
      if (previewOpen && updated?.id) {
        const url = await api.getWarningPresignedUrl(updated.id);
        setPreviewUrl(url);
      }
      toast.success(t('pages:warnings.regenerateSuccess'));
    } catch {
      toast.error(t('pages:warnings.regenerateFailed'));
    } finally {
      setRegenerating(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!warning?.id) return;
    setAcknowledging(true);
    try {
      const updated = await api.acknowledgeWarning(warning.id);
      setWarning(updated);
      // If preview is currently open, refresh iframe src with a fresh presigned URL
      // so the user sees the newly generated signatures.
      if (previewOpen && updated?.id) {
        const url = await api.getWarningPresignedUrl(updated.id);
        setPreviewUrl(url);
      }
      toast.success(t('pages:warningDetail.acknowledgeSuccess', 'Warning letter has been signed'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('pages:warningDetail.acknowledgeFailed', 'Failed to acknowledge warning');
      toast.error(msg);
    } finally {
      setAcknowledging(false);
    }
  };

  const handleDownloadAttachment = async (type: 'company_policy' | 'additional_reference') => {
    if (!warning?.id) return;
    try {
      await api.downloadWarningAttachment(warning.id, type);
    } catch {
      toast.error(t('pages:warnings.downloadFailed'));
    }
  };

  if (loading && !warning) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  if (error || !warning) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('pages:warningDetail.title')} subtitle="" />
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <p className="text-sm text-red-600 font-medium">{error ?? t('pages:warningDetail.notFound')}</p>
        </div>
        <Link to={backHref} className="inline-flex items-center gap-2 text-brand font-medium hover:underline">
          ← {backLabel}
        </Link>
      </div>
    );
  }

  const typeBadgeClass =
    warning.type === 'SP3'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';

  const isSigned = warning.status === 'signed';
  // Treat viewers without generate_document permission as the issued employee.
  const isEmployeeView = !canGenerateDocument;
  // Employees can only acknowledge once the document exists, is not yet signed,
  // and they have opened the warning letter preview at least once.
  const canAcknowledge = isEmployeeView && !isSigned && hasPreviewedWarning && !!warning.file_path;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={t('pages:warningDetail.pageTitle', { type: warning.type })}
        subtitle={warning.employee_name || (employee ? employee.full_name : null) || `ID: ${warning.employee_id}`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={backHref}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-brand font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {backLabel}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-800">{t('pages:warningDetail.details')}</h2>
            {warning.status && (
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  isSigned ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isSigned ? t('pages:warningDetail.statusSigned', 'Signed') : t('pages:warningDetail.statusDraft', 'Draft')}
              </span>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">{t('pages:warnings.documentNumber')}</dt>
              <dd className="mt-1 text-slate-800 font-mono text-sm">{warning.document_number ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">{t('pages:warnings.employee')}</dt>
              <dd className="mt-1">
                {(warning.employee_name || employee) ? (
                  employee ? (
                    <Link
                      to={`/employees/${employee.id}`}
                      className="text-brand font-medium hover:underline"
                    >
                      {employee.full_name}
                    </Link>
                  ) : (
                    <span className="text-slate-800">{warning.employee_name}</span>
                  )
                ) : (
                  <span className="text-slate-800">ID: {warning.employee_id}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">{t('pages:warnings.type')}</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${typeBadgeClass}`}
                >
                  {warning.type}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">{t('pages:warnings.warningDate')}</dt>
              <dd className="mt-1 text-slate-800">
                {warning.warning_date ? formatDate(warning.warning_date) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">{t('pages:warningDetail.statusLabel', 'Status')}</dt>
              <dd className="mt-1 text-slate-800">
                {isSigned ? t('pages:warningDetail.statusSigned', 'Signed') : t('pages:warningDetail.statusDraft', 'Draft')}
              </dd>
            </div>
            {warning.employee_acknowledged_at && (
              <div>
                <dt className="text-sm font-medium text-slate-500">
                  {t('pages:warningDetail.acknowledgedAt', 'Acknowledged at')}
                </dt>
                <dd className="mt-1 text-slate-800">
                  {formatDate(warning.employee_acknowledged_at)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-slate-500">{t('pages:warningDetail.durationMonths')}</dt>
              <dd className="mt-1 text-slate-800">
                {warning.duration_months != null ? `${warning.duration_months} ${t('pages:warningDetail.months')}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">{t('pages:warningDetail.createdAt')}</dt>
              <dd className="mt-1 text-slate-800">
                {warning.created_at ? formatDate(warning.created_at) : '—'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500">{t('pages:warnings.description')}</dt>
              <dd className="mt-1 text-slate-800 whitespace-pre-wrap">{warning.description ?? '—'}</dd>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{t('pages:warningDetail.documentsAndFiles')}</h3>
            <ul className="space-y-4">
              <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-slate-800">{t('pages:warningDetail.warningLetter')}</span>
                  <span className="text-sm text-slate-500">
                    {warning.file_path ? t('pages:warningDetail.documentGenerated') : t('pages:warningDetail.documentNotGenerated')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {warning.file_path ? (
                    <>
                      <Button variant="outline" onClick={handlePreview}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {t('common:preview')}
                      </Button>
                      {(!isEmployeeView || isSigned) && (
                        <Button variant="outline" onClick={handleDownload}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {t('pages:warnings.downloadDocument')}
                        </Button>
                      )}
                      {canGenerateDocument && !isSigned && (
                        <Button variant="ghost" onClick={handleRegenerate} disabled={regenerating}>
                          {regenerating ? (
                            <span className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                          {t('pages:warnings.regenerateDocument')}
                        </Button>
                      )}
                      {canGenerateDocument && isSigned && (
                        <span className="text-xs text-slate-500">
                          {t('pages:warningDetail.cannotRegenerateSigned', 'Document already signed and cannot be regenerated')}
                        </span>
                      )}
                    </>
                  ) : (
                    canGenerateDocument && (
                      <Button variant="primary" onClick={handleRegenerate} disabled={regenerating || isSigned}>
                        {regenerating ? (
                          <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : null}
                        {t('pages:warningDetail.generateDocument')}
                      </Button>
                    )
                  )}
                </div>
              </li>
              {warning.company_policy_file_path && (
                <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <span className="font-medium text-slate-800">{t('pages:warningDetail.companyPolicy')}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => handlePreviewAttachment('company_policy')}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {t('common:preview')}
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadAttachment('company_policy')}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {t('pages:warnings.downloadDocument')}
                    </Button>
                  </div>
                </li>
              )}
              {warning.additional_reference_file_path && (
                <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <span className="font-medium text-slate-800">{t('pages:warningDetail.additionalReference')}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => handlePreviewAttachment('additional_reference')}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {t('common:preview')}
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadAttachment('additional_reference')}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {t('pages:warnings.downloadDocument')}
                    </Button>
                  </div>
                </li>
              )}
            </ul>
            {isEmployeeView && !isSigned && warning.file_path && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/70 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800">
                    {t('pages:warningDetail.acknowledgeTitle', 'Please confirm this warning letter')}
                  </p>
                  <p className="text-xs text-amber-700">
                    {t(
                      'pages:warningDetail.acknowledgeDescription',
                      'By confirming, you acknowledge that you have read and understood the content of this warning letter. The document will be marked as signed and can no longer be changed.'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={handleAcknowledge}
                    disabled={acknowledging || !hasPreviewedWarning}
                  >
                    {acknowledging && (
                      <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    {t('pages:warningDetail.acknowledgeButton', 'I have read & confirm')}
                  </Button>
                </div>
              </div>
            )}
            {!warning.file_path && !warning.company_policy_file_path && !warning.additional_reference_file_path && (
              <p className="mt-2 text-sm text-slate-500">
                {t('pages:warningDetail.documentNotGenerated')}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

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
