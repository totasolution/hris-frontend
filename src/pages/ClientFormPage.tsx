import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { RegionSelect } from '../components/RegionSelect';
import type { Client, ClientDocType } from '../services/api';
import * as api from '../services/api';

const TABS = ['company', 'address', 'agreement', 'legalitas', 'penggajian'] as const;
type TabId = (typeof TABS)[number];

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new' || !id;
  const clientId = isNew ? null : parseInt(id!, 10);
  const navigate = useNavigate();
  const { t } = useTranslation(['pages', 'common']);

  const [activeTab, setActiveTab] = useState<TabId>('company');
  const [loading, setLoading] = useState(!isNew);
  const [savingTab, setSavingTab] = useState<TabId | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tab 1: Company Info
  const [name, setName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [status, setStatus] = useState('active');

  // Tab 2: Address
  const [address, setAddress] = useState('');
  const [addressUnit, setAddressUnit] = useState('');
  const [rtRw, setRtRw] = useState('');
  const [province, setProvince] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [district, setDistrict] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [kelurahan, setKelurahan] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Tab 3: Agreement
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [agreementStartDate, setAgreementStartDate] = useState('');
  const [agreementEndDate, setAgreementEndDate] = useState('');

  // Tab 4: Legalitas
  const [spkNumber, setSpkNumber] = useState('');
  const [npwpNumber, setNpwpNumber] = useState('');
  const [nibNumber, setNibNumber] = useState('');
  const [spkFile, setSpkFile] = useState<File | null>(null);
  const [npwpFile, setNpwpFile] = useState<File | null>(null);
  const [nibFile, setNibFile] = useState<File | null>(null);

  // Tab 5: Penggajian
  const [cutOffStart, setCutOffStart] = useState<number | ''>('');
  const [cutOffEnd, setCutOffEnd] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<number | ''>('');

  const loadClient = useCallback(async () => {
    if (!clientId || isNaN(clientId)) return;
    try {
      const c = await api.getClient(clientId);
      setName(c.name ?? '');
      setCompanyPhone(c.company_phone ?? '');
      setCompanyEmail(c.company_email ?? '');
      setCompanyWebsite(c.company_website ?? '');
      setStatus(c.status ?? 'active');
      setAddress(c.address ?? '');
      setAddressUnit(c.address_unit ?? '');
      setRtRw(c.rt_rw ?? '');
      setProvince(c.province ?? '');
      setDistrict(c.district ?? '');
      setSubDistrict(c.sub_district ?? '');
      setKelurahan(c.kelurahan ?? '');
      setZipCode(c.zip_code ?? '');
      setContactName(c.contact_name ?? '');
      setContactPhone(c.contact_phone ?? '');
      setAgreementStartDate(c.agreement_start_date ?? '');
      setAgreementEndDate(c.agreement_end_date ?? '');
      setSpkNumber(c.spk_number ?? '');
      setNpwpNumber(c.npwp_number ?? '');
      setNibNumber(c.nib_number ?? '');
      setCutOffStart(c.payroll_cut_off_start ?? '');
      setCutOffEnd(c.payroll_cut_off_end ?? '');
      setPaymentDate(c.payment_date ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    loadClient();
  }, [isNew, loadClient]);

  const saveTab = async (tab: TabId) => {
    setError(null);
    setSavingTab(tab);

    try {
      if (tab === 'company') {
        if (!name.trim()) {
          setError(t('pages:clients.companyNameRequired'));
          setSavingTab(null);
          return;
        }
        if (isNew) {
          const created = await api.createClient({
            name: name.trim(),
            company_phone: companyPhone.trim() || undefined,
            company_email: companyEmail.trim() || undefined,
            company_website: companyWebsite.trim() || undefined,
            status,
          });
          navigate(`/clients/${created.id}/edit`, { replace: true });
        } else if (clientId) {
          await api.patchClient(clientId, {
            name: name.trim(),
            company_phone: companyPhone.trim() || undefined,
            company_email: companyEmail.trim() || undefined,
            company_website: companyWebsite.trim() || undefined,
            status,
          });
        }
      } else if (tab === 'address' && clientId) {
        await api.patchClient(clientId, {
          address: address.trim() || undefined,
          address_unit: addressUnit.trim() || undefined,
          rt_rw: rtRw.trim() || undefined,
          province: province || undefined,
          district: district || undefined,
          sub_district: subDistrict || undefined,
          kelurahan: kelurahan.trim() || undefined,
          zip_code: zipCode.trim() || undefined,
        });
      } else if (tab === 'agreement' && clientId) {
        await api.patchClient(clientId, {
          contact_name: contactName.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          agreement_start_date: agreementStartDate || undefined,
          agreement_end_date: agreementEndDate || undefined,
        });
      } else if (tab === 'legalitas' && clientId) {
        const body: Partial<Client> = {};
        if (spkNumber.trim()) body.spk_number = spkNumber.trim();
        if (npwpNumber.trim()) body.npwp_number = npwpNumber.trim();
        if (nibNumber.trim()) body.nib_number = nibNumber.trim();
        if (Object.keys(body).length > 0) {
          await api.patchClient(clientId, body);
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedExt = /\.(png|pdf|doc|docx)$/i;
        const validateFile = (f: File, name: string) => {
          if (f.size > maxSize) throw new Error(`${name}: ${t('pages:clients.fileTooLarge')}`);
          if (!allowedExt.test(f.name)) throw new Error(`${name}: ${t('pages:clients.fileTypeNotAllowed')}`);
        };
        if (spkFile) {
          validateFile(spkFile, 'SPK');
          await api.uploadClientDocument(clientId, 'spk' as ClientDocType, spkFile);
          setSpkFile(null);
        }
        if (npwpFile) {
          validateFile(npwpFile, 'NPWP');
          await api.uploadClientDocument(clientId, 'npwp' as ClientDocType, npwpFile);
          setNpwpFile(null);
        }
        if (nibFile) {
          validateFile(nibFile, 'NIB');
          await api.uploadClientDocument(clientId, 'nib' as ClientDocType, nibFile);
          setNibFile(null);
        }
      } else if (tab === 'penggajian' && clientId) {
        await api.patchClient(clientId, {
          payroll_cut_off_start: cutOffStart === '' ? undefined : Number(cutOffStart),
          payroll_cut_off_end: cutOffEnd === '' ? undefined : Number(cutOffEnd),
          payment_date: paymentDate === '' ? undefined : Number(paymentDate),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingTab(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  const canEditOtherTabs = !isNew && clientId;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title={isNew ? t('pages:clients.newClient') : t('pages:clients.editClient')}
        subtitle={isNew ? t('pages:clients.newClientSubtitle') : `${t('pages:clients.updating')} ${name || '...'}`}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => (tab === 'company' || canEditOtherTabs) && setActiveTab(tab)}
            disabled={tab !== 'company' && !canEditOtherTabs}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand text-brand'
                : canEditOtherTabs || tab === 'company'
                ? 'border-transparent text-slate-600 hover:text-slate-900'
                : 'border-transparent text-slate-300 cursor-not-allowed'
            }`}
          >
            {t(`pages:clients.tabs.${tab}`)}
          </button>
        ))}
      </div>

      <Card>
        <CardBody>
          {activeTab === 'company' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{t('pages:clients.companyInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={t('pages:clients.companyName')} value={name} onChange={(e) => setName(e.target.value)} required placeholder="PT Example" />
                <Input label={t('pages:clients.companyPhone')} value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+62..." />
                <Input label={t('pages:clients.companyEmail')} type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="info@company.com" />
                <Input label={t('pages:clients.companyWebsite')} value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://..." />
                <Select label={t('common:status')} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">{t('common:active')}</option>
                  <option value="inactive">{t('common:inactive')}</option>
                </Select>
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => saveTab('company')} disabled={savingTab === 'company'}>
                  {savingTab === 'company' ? t('common:saving') : isNew ? t('pages:clients.createAndContinue') : t('common:save')}
                </Button>
                <Link to="/clients" className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors py-2">
                  {t('common:cancel')}
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{t('pages:clients.addressCompany')}</h3>
              <Textarea label={t('pages:clients.addressCompany')} value={address} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)} required rows={2} placeholder="Jalan..." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={t('pages:clients.addressUnit')} value={addressUnit} onChange={(e) => setAddressUnit(e.target.value)} required placeholder="No/Lantai/Unit" />
                <Input label="RT/RW" value={rtRw} onChange={(e) => setRtRw(e.target.value)} required placeholder="001/002" />
                <RegionSelect type="province" label={t('pages:clients.province')} value={province} onChange={(v, id) => { setProvince(v); setProvinceId(id ?? ''); setDistrict(''); setDistrictId(''); setSubDistrict(''); }} required />
                <RegionSelect type="district" provinceId={provinceId} label={t('pages:clients.district')} value={district} onChange={(v, id) => { setDistrict(v); setDistrictId(id ?? ''); setSubDistrict(''); }} required />
                <RegionSelect type="sub_district" districtId={districtId} label={t('pages:clients.subDistrict')} value={subDistrict} onChange={(v) => setSubDistrict(v)} required />
                <Input label={t('pages:clients.kelurahan')} value={kelurahan} onChange={(e) => setKelurahan(e.target.value)} required placeholder="Kelurahan" />
                <Input label={t('pages:clients.zipCode')} value={zipCode} onChange={(e) => setZipCode(e.target.value)} required placeholder="12345" />
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => saveTab('address')} disabled={savingTab === 'address'}>
                  {savingTab === 'address' ? t('common:saving') : t('common:save')}
                </Button>
                <Link to="/clients" className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors py-2">
                  {t('common:cancel')}
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'agreement' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{t('pages:clients.clientAgreement')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={t('pages:clients.namePic')} value={contactName} onChange={(e) => setContactName(e.target.value)} required placeholder="Nama PIC" />
                <Input label={t('pages:clients.handphonePic')} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required placeholder="+62..." />
                <Input label={t('pages:clients.agreementStart')} type="date" value={agreementStartDate} onChange={(e) => setAgreementStartDate(e.target.value)} required />
                <Input label={t('pages:clients.agreementEnd')} type="date" value={agreementEndDate} onChange={(e) => setAgreementEndDate(e.target.value)} required />
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => saveTab('agreement')} disabled={savingTab === 'agreement'}>
                  {savingTab === 'agreement' ? t('common:saving') : t('common:save')}
                </Button>
                <Link to="/clients" className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors py-2">
                  {t('common:cancel')}
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'legalitas' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{t('pages:clients.legalitas')}</h3>
              <div className="space-y-4">
                <p className="text-xs text-slate-500 mb-2">{t('pages:clients.documentUploadHint')}</p>
                <div className="p-5 rounded-lg bg-slate-50 space-y-5">
                  <p className="text-sm font-bold text-slate-700">SPK (Surat Perintah Kerja)</p>
                  <div className="pt-1">
                    <Input label={t('pages:clients.documentNumber')} value={spkNumber} onChange={(e) => setSpkNumber(e.target.value)} required placeholder="Nomor SPK" />
                  </div>
                  <div className="pt-2">
                    <input type="file" accept=".png,.pdf,.doc,.docx" onChange={(e) => setSpkFile(e.target.files?.[0] ?? null)} className="block text-sm py-2.5 px-1" />
                  </div>
                </div>
                <div className="p-5 rounded-lg bg-slate-50 space-y-5">
                  <p className="text-sm font-bold text-slate-700">NPWP Perusahaan</p>
                  <div className="pt-1">
                    <Input label={t('pages:clients.documentNumber')} value={npwpNumber} onChange={(e) => setNpwpNumber(e.target.value)} placeholder="Nomor NPWP" />
                  </div>
                  <div className="pt-2">
                    <input type="file" accept=".png,.pdf,.doc,.docx" onChange={(e) => setNpwpFile(e.target.files?.[0] ?? null)} className="block text-sm py-2.5 px-1" />
                  </div>
                </div>
                <div className="p-5 rounded-lg bg-slate-50 space-y-5">
                  <p className="text-sm font-bold text-slate-700">NIB</p>
                  <div className="pt-1">
                    <Input label={t('pages:clients.documentNumber')} value={nibNumber} onChange={(e) => setNibNumber(e.target.value)} placeholder="Nomor NIB" />
                  </div>
                  <div className="pt-2">
                    <input type="file" accept=".png,.pdf,.doc,.docx" onChange={(e) => setNibFile(e.target.files?.[0] ?? null)} className="block text-sm py-2.5 px-1" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => saveTab('legalitas')} disabled={savingTab === 'legalitas'}>
                  {savingTab === 'legalitas' ? t('common:saving') : t('common:save')}
                </Button>
                <Link to="/clients" className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors py-2">
                  {t('common:cancel')}
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'penggajian' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{t('pages:clients.penggajian')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label={t('pages:clients.cutOffStart')}
                  type="number"
                  min={1}
                  max={31}
                  value={cutOffStart}
                  onChange={(e) => setCutOffStart(e.target.value ? parseInt(e.target.value, 10) : '')}
                  placeholder="1"
                />
                <Input
                  label={t('pages:clients.cutOffEnd')}
                  type="number"
                  min={1}
                  max={31}
                  value={cutOffEnd}
                  onChange={(e) => setCutOffEnd(e.target.value ? parseInt(e.target.value, 10) : '')}
                  placeholder="31"
                />
                <Input
                  label={t('pages:clients.paymentDate')}
                  type="number"
                  min={1}
                  max={31}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value ? parseInt(e.target.value, 10) : '')}
                  placeholder="25"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => saveTab('penggajian')} disabled={savingTab === 'penggajian'}>
                  {savingTab === 'penggajian' ? t('common:saving') : t('common:save')}
                </Button>
                <Link to="/clients" className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors py-2">
                  {t('common:cancel')}
                </Link>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
