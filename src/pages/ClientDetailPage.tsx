import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import type { Client, ClientDocType } from '../services/api';
import * as api from '../services/api';

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

function LegalitasDocRow({
  label,
  hasDoc,
  onPreview,
  t,
}: {
  label: string;
  hasDoc: boolean;
  onPreview: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        {hasDoc ? (
          <>
            <span className="text-sm text-green-600">✓</span>
            <button
              type="button"
              onClick={onPreview}
              className="text-sm font-medium text-brand hover:text-brand/80 transition-colors flex items-center gap-1"
              title={t('common:preview')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {t('common:preview')}
            </button>
          </>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </div>
    </div>
  );
}

const DETAIL_TABS = ['company', 'address', 'agreement', 'legalitas', 'penggajian'] as const;
type DetailTabId = (typeof DETAIL_TABS)[number];

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['pages', 'common']);
  const toast = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTabId>('company');

  const openPreview = async (docType: ClientDocType, title: string) => {
    if (!client?.id) return;
    setPreviewOpen(true);
    setPreviewUrl(null);
    setPreviewTitle(title);
    setPreviewLoading(true);
    try {
      const url = await api.getClientDocumentURL(client.id, docType);
      setPreviewUrl(url);
    } catch {
      toast.error(t('pages:clients.documentLoadFailed'));
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!id || id === 'new') return;
    (async () => {
      try {
        const c = await api.getClient(parseInt(id, 10));
        setClient(c);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <PageHeader title={t('pages:clients.clientDetail')} />
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-sm text-red-600 font-medium">{error ?? t('pages:clients.clientNotFound')}</p>
          <Link to="/clients" className="text-sm text-brand font-medium mt-2 inline-block">
            ← {t('common:backToList')}
          </Link>
        </div>
      </div>
    );
  }

  const fullAddress = [client.address, client.address_unit, client.rt_rw, client.kelurahan, client.sub_district, client.district, client.province, client.zip_code]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title={client.name}
        subtitle={t('pages:clients.clientDetailSubtitle')}
        actions={<ButtonLink to={`/clients/${client.id}/edit`}>{t('common:edit')}</ButtonLink>}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t(`pages:clients.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'company' && (
        <Card>
          <CardBody>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
              {t('pages:clients.companyInfo')}
            </h3>
            <DetailRow label={t('pages:clients.companyName')} value={client.name} />
            <DetailRow label={t('pages:clients.companyPhone')} value={client.company_phone} />
            <DetailRow label={t('pages:clients.companyEmail')} value={client.company_email} />
            <DetailRow label={t('pages:clients.companyWebsite')} value={client.company_website} />
            <DetailRow label={t('common:status')} value={client.status} />
          </CardBody>
        </Card>
      )}

      {activeTab === 'address' && (
        <Card>
          <CardBody>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
              {t('pages:clients.addressCompany')}
            </h3>
            {fullAddress ? (
              <p className="text-sm text-slate-800">{fullAddress}</p>
            ) : (
              <p className="text-sm text-slate-400">—</p>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'agreement' && (
        <Card>
          <CardBody>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
              {t('pages:clients.clientAgreement')}
            </h3>
            <DetailRow label={t('pages:clients.namePic')} value={client.contact_name} />
            <DetailRow label={t('pages:clients.handphonePic')} value={client.contact_phone} />
            <DetailRow label={t('pages:clients.agreementStart')} value={client.agreement_start_date} />
            <DetailRow label={t('pages:clients.agreementEnd')} value={client.agreement_end_date} />
          </CardBody>
        </Card>
      )}

      {activeTab === 'legalitas' && (
        <Card>
          <CardBody>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
              {t('pages:clients.legalitas')}
            </h3>
            <DetailRow label="SPK (Nomor)" value={client.spk_number} />
            <LegalitasDocRow
              label="SPK (Document)"
              hasDoc={!!client.spk_document_url}
              onPreview={() => openPreview('spk', 'SPK Document')}
              t={t}
            />
            <DetailRow label="NPWP (Nomor)" value={client.npwp_number} />
            <LegalitasDocRow
              label="NPWP (Document)"
              hasDoc={!!client.npwp_document_url}
              onPreview={() => openPreview('npwp', 'NPWP Document')}
              t={t}
            />
            <DetailRow label="NIB (Nomor)" value={client.nib_number} />
            <LegalitasDocRow
              label="NIB (Document)"
              hasDoc={!!client.nib_document_url}
              onPreview={() => openPreview('nib', 'NIB Document')}
              t={t}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'penggajian' && (
        <Card>
          <CardBody>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
              {t('pages:clients.penggajian')}
            </h3>
            <DetailRow label={t('pages:clients.cutOffStart')} value={client.payroll_cut_off_start} />
            <DetailRow label={t('pages:clients.cutOffEnd')} value={client.payroll_cut_off_end} />
            <DetailRow label={t('pages:clients.paymentDate')} value={client.payment_date} />
          </CardBody>
        </Card>
      )}

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
