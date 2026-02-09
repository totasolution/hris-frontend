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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const info = await api.getTenantCompanyInfo();
        setCompanyName(info.company_name || '');
        setCompanyAddress(info.company_address || '');
        setRepresentativeName(info.company_representative_name || '');
        setRepresentativeTitle(info.company_representative_title || '');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t('pages:companySettings.loadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

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
