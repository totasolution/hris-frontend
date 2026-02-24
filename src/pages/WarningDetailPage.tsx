import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
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

  const handleRegenerate = async () => {
    if (!warning?.id) return;
    setRegenerating(true);
    try {
      const updated = await api.generateWarningDocument(warning.id);
      setWarning(updated);
      toast.success(t('pages:warnings.regenerateSuccess'));
    } catch {
      toast.error(t('pages:warnings.regenerateFailed'));
    } finally {
      setRegenerating(false);
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
          <h2 className="text-lg font-bold text-slate-800">{t('pages:warningDetail.details')}</h2>
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
                      <Button variant="outline" onClick={handleDownload}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t('pages:warnings.downloadDocument')}
                      </Button>
                      {canGenerateDocument && (
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
                    </>
                  ) : (
                    canGenerateDocument && (
                      <Button variant="primary" onClick={handleRegenerate} disabled={regenerating}>
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
                  <Button variant="outline" onClick={() => handleDownloadAttachment('company_policy')}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('pages:warnings.downloadDocument')}
                  </Button>
                </li>
              )}
              {warning.additional_reference_file_path && (
                <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <span className="font-medium text-slate-800">{t('pages:warningDetail.additionalReference')}</span>
                  <Button variant="outline" onClick={() => handleDownloadAttachment('additional_reference')}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('pages:warnings.downloadDocument')}
                  </Button>
                </li>
              )}
            </ul>
            {!warning.file_path && !warning.company_policy_file_path && !warning.additional_reference_file_path && (
              <p className="mt-2 text-sm text-slate-500">
                {t('pages:warningDetail.documentNotGenerated')}
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
