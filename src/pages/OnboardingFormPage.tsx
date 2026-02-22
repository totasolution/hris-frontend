import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDefaultDeclarationChecklist } from '../constants/onboardingDeclaration';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { Select } from '../components/Select';
import * as api from '../services/api';
import type { DeclarationChecklistData } from '../services/api';

export default function OnboardingFormPage() {
  const { token } = useParams<{ token: string }>();
  const [candidate, setCandidate] = useState<api.Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [declarationChecklist, setDeclarationChecklist] = useState<DeclarationChecklistData>(() => getDefaultDeclarationChecklist());
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [ktpUploaded, setKtpUploaded] = useState(false);
  const [kkFile, setKkFile] = useState<File | null>(null);
  const [uploadingKk, setUploadingKk] = useState(false);
  const [kkUploaded, setKkUploaded] = useState(false);
  const [skckFile, setSkckFile] = useState<File | null>(null);
  const [uploadingSkck, setUploadingSkck] = useState(false);
  const [skckUploaded, setSkckUploaded] = useState(false);
  const ktpInputRef = useRef<HTMLInputElement>(null);

  // Form Fields - Auto-filled with default values for testing
  const [formData, setFormData] = useState({
    id_number: '',
    address: '',
    domicile_address: '',
    place_of_birth: '',
    date_of_birth: '',
    gender: '',
    religion: '',
    marital_status: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
    npwp_number: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    if (!token) {
      setError('Tautan tidak valid');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { candidate: c } = await api.getOnboardingByToken(token);
        setCandidate(c);
        // Auto-fill bank account holder with candidate name if available
        if (c) {
          setFormData(prev => ({ ...prev, bank_account_holder: c.full_name }));
        }

        // Try to load existing onboarding form data (if candidate re-opens the link)
        try {
          const existing = await api.getOnboardingFormByToken(token);
          setFormData(prev => ({
            ...prev,
            id_number: existing.id_number ?? prev.id_number,
            address: existing.address ?? prev.address,
            domicile_address: existing.domicile_address ?? prev.domicile_address,
            place_of_birth: existing.place_of_birth ?? prev.place_of_birth,
            date_of_birth: existing.date_of_birth
              ? existing.date_of_birth.split('T')[0]
              : prev.date_of_birth,
            gender: existing.gender ?? prev.gender,
            religion: existing.religion ?? prev.religion,
            marital_status: existing.marital_status ?? prev.marital_status,
            bank_name: existing.bank_name ?? prev.bank_name,
            bank_account_number: existing.bank_account_number ?? prev.bank_account_number,
            bank_account_holder: existing.bank_account_holder ?? prev.bank_account_holder,
            npwp_number: existing.npwp_number ?? prev.npwp_number,
            emergency_contact_name: existing.emergency_contact_name ?? prev.emergency_contact_name,
            emergency_contact_relationship: existing.emergency_contact_relationship ?? prev.emergency_contact_relationship,
            emergency_contact_phone: existing.emergency_contact_phone ?? prev.emergency_contact_phone,
          }));
          if (existing.declaration_checklist && typeof existing.declaration_checklist === 'object') {
            setDeclarationChecklist(existing.declaration_checklist as DeclarationChecklistData);
          }
        } catch {
          // No existing form yet; ignore
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Tautan tidak ditemukan atau sudah kedaluwarsa');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKtpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Silakan unggah gambar (JPEG atau PNG). OCR bekerja paling baik dengan gambar.');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }
      setKtpFile(file);
      setKtpUploaded(false);
      setError(null);
    }
  };

  const handleKkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Silakan unggah gambar (JPEG, PNG) atau PDF.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }
      setKkFile(file);
      setKkUploaded(false);
      setError(null);
    }
  };

  const handleSkckFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Silakan unggah gambar (JPEG, PNG) atau PDF.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }
      setSkckFile(file);
      setSkckUploaded(false);
      setError(null);
    }
  };

  const handleKtpUpload = async () => {
    if (!token || !ktpFile) return;
    setUploadingKtp(true);
    setError(null);
    try {
      const response = await api.uploadOnboardingDocument(token, ktpFile, 'ktp');
      const confidence = response.ocr_confidence ?? 0;

      // OCR confidence below 50% - ask user to re-upload with better quality
      if (confidence < 0.5) {
        setError('KTP tidak terbaca dengan jelas. Silakan unggah gambar beresolusi lebih tinggi. Pastikan pencahayaan baik dan seluruh KTP terlihat.');
        setKtpFile(null);
        setKtpUploaded(false);
        if (ktpInputRef.current) ktpInputRef.current.value = '';
        return;
      }

      // Populate form with extracted data (backend returns KTP struct: nik, name, place_dob, address_1..4, gender as LAKI-LAKI/PEREMPUAN, married_status, etc.)
      if (response.extracted_data) {
        const extracted = response.extracted_data;
        const genderForForm =
          extracted.gender === 'LAKI-LAKI' ? 'male' : extracted.gender === 'PEREMPUAN' ? 'female' : (extracted.gender || '');
        const address =
          extracted.address ||
          [extracted.address_1, extracted.address_2, extracted.address_3, extracted.address_4].filter(Boolean).join(', ') ||
          '';
        const placeDob = extracted.place_dob || '';
        const [placeFromDob, dateFromDob] = placeDob ? (placeDob.includes(',') ? placeDob.split(',').map((s: string) => s.trim()) : [placeDob, '']) : ['', ''];
        setFormData(prev => ({
          ...prev,
          id_number: extracted.nik || extracted.id_number || prev.id_number,
          address: address || prev.address,
          place_of_birth: extracted.birth_place || placeFromDob || prev.place_of_birth,
          date_of_birth: extracted.birth_date ? extracted.birth_date.split('T')[0] : (dateFromDob && dateFromDob.match(/\d{2}-\d{2}-\d{4}/) ? dateFromDob.split('-').reverse().join('-') : prev.date_of_birth),
          gender: genderForForm || prev.gender,
          religion: extracted.religion || prev.religion,
          marital_status: extracted.married_status || extracted.marital_status || prev.marital_status,
        }));
        if (confidence < 0.6) {
          setError(`Data terbaca dengan keyakinan rendah (${Math.round(confidence * 100)}%). Silakan periksa dan perbaiki jika perlu.`);
        }
      }
      setKtpUploaded(true);
      setKtpFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unggah gagal');
    } finally {
      setUploadingKtp(false);
    }
  };

  const handleKkUpload = async () => {
    if (!token || !kkFile) return;
    setUploadingKk(true);
    setError(null);
    try {
      await api.uploadOnboardingDocument(token, kkFile, 'kk');
      setKkUploaded(true);
      setKkFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unggah gagal');
    } finally {
      setUploadingKk(false);
    }
  };

  const handleSkckUpload = async () => {
    if (!token || !skckFile) return;
    setUploadingSkck(true);
    setError(null);
    try {
      await api.uploadOnboardingDocument(token, skckFile, 'skck');
      setSkckUploaded(true);
      setSkckFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unggah gagal');
    } finally {
      setUploadingSkck(false);
    }
  };

  const handleNextToDeclaration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ktpUploaded || !kkUploaded) {
      setError('Silakan unggah KTP dan Kartu Keluarga (KK) sebelum melanjutkan.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmitDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const allKetentuanChecked = declarationChecklist.ketentuan.every((i) => i.checked);
    const allSanksiChecked = declarationChecklist.sanksi.every((i) => i.checked);
    const finalChecked = declarationChecklist.finalDeclaration.checked;
    if (!allKetentuanChecked || !allSanksiChecked || !finalChecked) {
      setError('Silakan centang semua pernyataan KETENTUAN, SANKSI, dan pernyataan akhir sebelum mengirim.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.submitOnboardingForm(token, {
        ...formData,
        declaration_checklist: declarationChecklist,
        data_reviewed: true,
      });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pengiriman gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const setKetentuanChecked = (id: string, checked: boolean) => {
    setDeclarationChecklist((prev) => ({
      ...prev,
      ketentuan: prev.ketentuan.map((i) => (i.id === id ? { ...i, checked } : i)),
    }));
  };
  const setSanksiChecked = (id: string, checked: boolean) => {
    setDeclarationChecklist((prev) => ({
      ...prev,
      sanksi: prev.sanksi.map((i) => (i.id === id ? { ...i, checked } : i)),
    }));
  };
  const setFinalDeclarationChecked = (checked: boolean) => {
    setDeclarationChecklist((prev) => ({
      ...prev,
      finalDeclaration: { ...prev.finalDeclaration, checked },
    }));
  };

  // Full-page loading: initial load or any document processing
  if (loading || uploadingKtp || uploadingKk || uploadingSkck) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
      <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-brand"></div>
      <p className="text-slate-500 font-medium">
        {uploadingKtp ? 'Memproses KTP... Mengekstrak data, harap tunggu.' : 'Memuat...'}
      </p>
    </div>
  );

  if (error && !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md w-full p-10 text-center space-y-6">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-brand-dark font-headline">Tautan Kedaluwarsa atau Tidak Valid</h1>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
          <p className="text-xs text-slate-400">Silakan hubungi recruiter Anda untuk mendapatkan tautan onboarding baru.</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md w-full p-10 text-center space-y-6">
          <div className="h-16 w-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-brand-dark font-headline tracking-tight">Pengiriman Berhasil</h1>
            <p className="text-slate-500 text-sm leading-relaxed">Terima kasih telah mengisi data, <span className="font-bold text-brand-dark">{candidate?.full_name}</span>. Tim HR kami akan meninjau dalam waktu dekat.</p>
          </div>
          <p className="text-xs text-slate-400">Anda dapat menutup jendela ini.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-body">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <img src="/logo-sigma.png" alt="Sigma Solusi" className="h-12 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-brand-dark font-headline tracking-tight">
            {step === 2 ? 'Pernyataan & Persetujuan' : 'Data Pribadi'}
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed max-w-lg mx-auto">
            {step === 2
              ? 'Baca dan centang semua pernyataan di bawah, lalu klik Setujui dan Kirim.'
              : `Selamat datang, ${candidate?.full_name ? ` ${candidate.full_name}` : ''}. Silakan lengkapi formulir di bawah untuk melanjutkan onboarding.`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {step === 2 ? (
          <form onSubmit={handleSubmitDeclaration} className="space-y-8">
            <Card>
              <CardBody className="space-y-6">
                <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline border-b border-brand/10 pb-4">KETENTUAN</h3>
                <div className="space-y-4">
                  {declarationChecklist.ketentuan.map((item, idx) => (
                    <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => setKetentuanChecked(item.id, e.target.checked)}
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand shrink-0"
                      />
                      <span className="text-sm text-slate-700 leading-relaxed">
                        <span className="font-medium">{idx + 1}. </span>
                        {item.text}
                        {item.subItems && (
                          <ul className="mt-2 ml-4 list-disc space-y-1 text-slate-600">
                            {item.subItems.map((sub, idx) => (
                              <li key={idx}>{sub}</li>
                            ))}
                          </ul>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-6">
                <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline border-b border-brand/10 pb-4">SANKSI</h3>
                <div className="space-y-4">
                  {declarationChecklist.sanksi.map((item, idx) => (
                    <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => setSanksiChecked(item.id, e.target.checked)}
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand shrink-0"
                      />
                      <span className="text-sm text-slate-700 leading-relaxed">
                        <span className="font-medium">{idx + 1}. </span>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={declarationChecklist.finalDeclaration.checked}
                    onChange={(e) => setFinalDeclarationChecked(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand shrink-0"
                  />
                  <span className="text-sm text-slate-700 leading-relaxed">
                    {declarationChecklist.finalDeclaration.text}
                  </span>
                </label>
              </CardBody>
            </Card>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="order-2 sm:order-1">
                Kembali
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 order-1 sm:order-2 py-5 text-lg shadow-2xl shadow-brand/20">
                {submitting ? 'Mengirim...' : 'Setujui dan Kirim'}
              </Button>
            </div>
            <p className="text-center text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">
              Pengiriman Aman • Sigma Solusi Servis
            </p>
          </form>
        ) : (
        <form onSubmit={handleNextToDeclaration} className="space-y-8">
          {/* Dokumen Upload Section - KTP, KK, SKCK */}
          <Card>
            <CardBody className="space-y-8">
              <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline border-b border-brand/10 pb-4">1. Unggah Dokumen</h3>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Unggah dokumen berikut. KTP dan Kartu Keluarga (KK) wajib, SKCK bersifat opsional.
                </p>
                <div className="space-y-4">
                  {/* KTP */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-slate-700">KTP (wajib)</p>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input
                          ref={ktpInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleKtpFileChange}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 file:cursor-pointer"
                          disabled={uploadingKtp || ktpUploaded}
                        />
                        <p className="mt-1 text-xs text-slate-500">Format: JPEG, PNG (maks. 5MB). Gambar memberikan hasil OCR terbaik.</p>
                      </div>
                      {ktpFile && !ktpUploaded && (
                        <Button
                          type="button"
                          onClick={handleKtpUpload}
                          disabled={uploadingKtp}
                          className="px-4 py-2"
                        >
                          {uploadingKtp ? 'Memproses...' : 'Unggah & Ekstrak'}
                        </Button>
                      )}
                      {ktpUploaded && (
                        <div className="flex items-center gap-2 text-green-600 text-xs">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>KTP berhasil diunggah</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KK */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-slate-700">Kartu Keluarga (KK) - wajib</p>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleKkFileChange}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 file:cursor-pointer"
                          disabled={uploadingKk || kkUploaded}
                        />
                        <p className="mt-1 text-xs text-slate-500">Format: JPEG, PNG, atau PDF (maks. 5MB).</p>
                      </div>
                      {kkFile && !kkUploaded && (
                        <Button
                          type="button"
                          onClick={handleKkUpload}
                          disabled={uploadingKk}
                          className="px-4 py-2"
                        >
                          {uploadingKk ? 'Memproses...' : 'Unggah'}
                        </Button>
                      )}
                      {kkUploaded && (
                        <div className="flex items-center gap-2 text-green-600 text-xs">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>KK berhasil diunggah</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SKCK */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-slate-700">SKCK (opsional)</p>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleSkckFileChange}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 file:cursor-pointer"
                          disabled={uploadingSkck || skckUploaded}
                        />
                        <p className="mt-1 text-xs text-slate-500">Format: JPEG, PNG, atau PDF (maks. 5MB).</p>
                      </div>
                      {skckFile && !skckUploaded && (
                        <Button
                          type="button"
                          onClick={handleSkckUpload}
                          disabled={uploadingSkck}
                          className="px-4 py-2"
                        >
                          {uploadingSkck ? 'Memproses...' : 'Unggah'}
                        </Button>
                      )}
                      {skckUploaded && (
                        <div className="flex items-center gap-2 text-green-600 text-xs">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>SKCK berhasil diunggah</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Personal Section */}
          <Card>
            <CardBody className="space-y-8">
              <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline border-b border-brand/10 pb-4">2. Data Pribadi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="NIK (KTP)" name="id_number" value={formData.id_number} onChange={handleInputChange} required placeholder="NIK 16 digit" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Tempat Lahir" name="place_of_birth" value={formData.place_of_birth} onChange={handleInputChange} required placeholder="Kota" />
                  <Input label="Tanggal Lahir" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} required />
                </div>
                <Select label="Jenis Kelamin" name="gender" value={formData.gender} onChange={handleInputChange} required>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </Select>
                <Input label="Agama" name="religion" value={formData.religion} onChange={handleInputChange} required placeholder="mis. Islam, Kristen" />
                <Select label="Status Pernikahan" name="marital_status" value={formData.marital_status} onChange={handleInputChange} required>
                  <option value="single">Lajang</option>
                  <option value="married">Menikah</option>
                  <option value="divorced">Cerai</option>
                </Select>
                <Input label="Nomor NPWP" name="npwp_number" value={formData.npwp_number} onChange={handleInputChange} placeholder="Nomor pajak (opsional)" />
                <div className="md:col-span-2">
                  <Textarea label="Alamat KTP/ID" name="address" value={formData.address} onChange={handleInputChange} required rows={3} placeholder="Alamat sesuai KTP..." />
                <Textarea label="Alamat Domisili" name="domicile_address" value={formData.domicile_address} onChange={handleInputChange} rows={3} placeholder="Alamat domisili saat ini (jika berbeda dari KTP)..." />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Financial Section */}
          <Card>
            <CardBody className="space-y-8">
              <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline border-b border-brand/10 pb-4">3. Informasi Rekening Bank</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Nama Bank" name="bank_name" value={formData.bank_name} onChange={handleInputChange} required placeholder="mis. BCA, Mandiri" />
                  <Input label="Nomor Rekening" name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} required placeholder="0000000000" />
                  <div className="md:col-span-2">
                  <Input label="Nama Pemilik Rekening" name="bank_account_holder" value={formData.bank_account_holder} onChange={handleInputChange} required placeholder="Nama sesuai buku tabungan" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardBody className="space-y-8">
              <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline border-b border-brand/10 pb-4">4. Kontak Darurat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nama Kontak" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} required placeholder="Nama lengkap" />
                <Input label="Hubungan" name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleInputChange} required placeholder="mis. Suami/Istri, Orang Tua" />
                <div className="md:col-span-2">
                  <Input label="Nomor Telepon Kontak" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleInputChange} required placeholder="+62..." />
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="pt-6">
            <Button type="submit" className="w-full py-5 text-lg shadow-2xl shadow-brand/20">
              Lanjut ke Pernyataan
            </Button>
            <p className="mt-6 text-center text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">
              Langkah 1 dari 2 • Sigma Solusi Servis
            </p>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
