import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Card, CardHeader, CardBody } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Input, Textarea, Label, FormGroup } from '../components/Input';
import { useToast } from '../components/Toast';
import * as api from '../services/api';

export default function CompanySettingsPage() {
  const { t } = useTranslation(['pages', 'common']);
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeTitle, setRepresentativeTitle] = useState('');
  const [companyStampUrl, setCompanyStampUrl] = useState<string | null>(null);
  const [uploadingStamp, setUploadingStamp] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const info = await api.getTenantCompanyInfo();
        setCompanyName(info.company_name || '');
        setCompanyAddress(info.company_address || '');
        setRepresentativeName(info.company_representative_name || '');
        setRepresentativeTitle(info.company_representative_title || '');
        setCompanyStampUrl(info.company_stamp_url ?? null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t('pages:companySettings.loadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const handleStampFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingStamp(true);
    try {
      const { company_stamp_url: url } = await api.uploadTenantCompanyStamp(file);
      setCompanyStampUrl(url);
      toast.success(t('pages:companySettings.stampUploadSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pages:companySettings.stampUploadFailed'));
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleRemoveStamp = async () => {
    setUploadingStamp(true);
    try {
      await api.deleteTenantCompanyStamp();
      setCompanyStampUrl(null);
      toast.success(t('pages:companySettings.stampRemoved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pages:companySettings.stampUploadFailed'));
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateTenantCompanyInfo({
        company_name: companyName || undefined,
        company_address: companyAddress || undefined,
        company_representative_name: representativeName || undefined,
        company_representative_title: representativeTitle || undefined,
      });
      toast.success(t('pages:companySettings.updateSuccess'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages:companySettings.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

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
        title={t('pages:companySettings.title')}
        subtitle={t('pages:companySettings.subtitle')}
      />

      <Card>
        <CardHeader title={t('pages:companySettings.companyDetails')} />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormGroup>
              <Label>{t('pages:companySettings.companyName')}</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('pages:companySettings.companyNamePlaceholder')}
              />
              <p className="text-xs text-slate-400 mt-1">
                {t('pages:companySettings.companyNameHint')}
              </p>
            </FormGroup>

            <FormGroup>
              <Label>{t('pages:companySettings.companyAddress')}</Label>
              <Textarea
                value={companyAddress}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyAddress(e.target.value)}
                placeholder={t('pages:companySettings.companyAddressPlaceholder')}
                rows={3}
              />
              <p className="text-xs text-slate-400 mt-1">
                {t('pages:companySettings.companyAddressHint')}
              </p>
            </FormGroup>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup>
                <Label>{t('pages:companySettings.representativeName')}</Label>
                <Input
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  placeholder={t('pages:companySettings.representativeNamePlaceholder')}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {t('pages:companySettings.representativeNameHint')}
                </p>
              </FormGroup>

              <FormGroup>
                <Label>{t('pages:companySettings.representativeTitle')}</Label>
                <Input
                  value={representativeTitle}
                  onChange={(e) => setRepresentativeTitle(e.target.value)}
                  placeholder={t('pages:companySettings.representativeTitlePlaceholder')}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {t('pages:companySettings.representativeTitleHint')}
                </p>
              </FormGroup>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={saving}>
                {saving ? t('pages:companySettings.saving') : t('pages:companySettings.saveButton')}
              </Button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <FormGroup>
              <Label>{t('pages:companySettings.companyStamp')}</Label>
              <p className="text-xs text-slate-500 mb-3">{t('pages:companySettings.companyStampHint')}</p>
              {companyStampUrl ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-600">{t('pages:companySettings.currentStamp')}</p>
                  <div className="inline-block border border-slate-200 rounded-xl p-2 bg-white max-w-xs">
                    <img src={companyStampUrl} alt="" className="max-h-32 w-auto object-contain" />
                  </div>
                  <div className="text-[10px] text-slate-400 break-all">{companyStampUrl}</div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mb-2">{t('pages:companySettings.noStamp')}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    onChange={handleStampFile}
                    disabled={uploadingStamp}
                  />
                  <span className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-brand text-white cursor-pointer hover:opacity-90 disabled:opacity-50">
                    {uploadingStamp ? t('pages:companySettings.uploadingStamp') : t('pages:companySettings.uploadStamp')}
                  </span>
                </label>
                {companyStampUrl && (
                  <Button type="button" variant="secondary" onClick={handleRemoveStamp} disabled={uploadingStamp}>
                    {t('pages:companySettings.removeStamp')}
                  </Button>
                )}
              </div>
            </FormGroup>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-blue-50 border-blue-100">
        <CardBody>
          <h3 className="text-sm font-semibold text-blue-900 mb-2">{t('pages:companySettings.howUsedTitle')}</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>{t('pages:companySettings.howUsed1')}</li>
            <li>{t('pages:companySettings.howUsed2')}</li>
            <li>{t('pages:companySettings.howUsed3')}</li>
            <li>{t('pages:companySettings.howUsed4')}</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
