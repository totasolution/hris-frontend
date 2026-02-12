
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { Select } from '../components/Select';
import * as api from '../services/api';

export default function OnboardingFormPage() {
  const { token } = useParams<{ token: string }>();
  const [candidate, setCandidate] = useState<api.Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [ktpUploaded, setKtpUploaded] = useState(false);

  // Form Fields - Auto-filled with default values for testing
  const [formData, setFormData] = useState({
    id_number: '',
    address: '',
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
      setError('Invalid link');
      setLoading(false);
      return;
    }
    api.getOnboardingByToken(token)
      .then(({ candidate: c }) => {
        setCandidate(c);
        // Auto-fill bank account holder with candidate name if available
        if (c) {
          setFormData(prev => ({ ...prev, bank_account_holder: c.full_name }));
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Link not found or expired'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKtpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload an image (JPEG, PNG, WebP) or PDF file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setKtpFile(file);
      setKtpUploaded(false);
      setError(null);
    }
  };

  const handleKtpUpload = async () => {
    if (!token || !ktpFile) return;
    setUploadingKtp(true);
    setError(null);
    try {
      const response = await api.uploadOnboardingDocument(token, ktpFile);
      
      // Check if OCR extracted data is available
      if (response.extracted_data) {
        const extracted = response.extracted_data;
        
        // Auto-populate form fields with extracted data
        setFormData(prev => ({
          ...prev,
          id_number: extracted.id_number || prev.id_number,
          address: extracted.address || prev.address,
          place_of_birth: extracted.birth_place || prev.place_of_birth,
          date_of_birth: extracted.birth_date ? extracted.birth_date.split('T')[0] : prev.date_of_birth,
          gender: extracted.gender || prev.gender,
          religion: extracted.religion || prev.religion,
          marital_status: extracted.marital_status || prev.marital_status,
        }));
        
        // Show success message with confidence indicator
        const confidence = response.ocr_confidence || 0;
        if (confidence < 0.6) {
          setError(`Data extracted with low confidence (${Math.round(confidence * 100)}%). Please review and correct if needed.`);
        }
      }
      
      setKtpUploaded(true);
      setKtpFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingKtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitOnboardingForm(token, formData);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
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
            <h1 className="text-xl font-bold text-brand-dark font-headline">Link Expired or Invalid</h1>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
          <p className="text-xs text-slate-400">Please contact your recruiter for a new onboarding link.</p>
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
            <h1 className="text-xl font-bold text-brand-dark font-headline tracking-tight">Submission Successful</h1>
            <p className="text-slate-500 text-sm leading-relaxed">Thank you for providing your information, <span className="font-bold text-brand-dark">{candidate?.full_name}</span>. Our HR team will review it shortly.</p>
          </div>
          <p className="text-xs text-slate-400">You can now close this window.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-body">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <img src="/logo-sigma.png" alt="Sigma Solusi" className="h-12 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-brand-dark font-headline tracking-tight">Personal Information</h1>
          <p className="text-slate-500 font-medium leading-relaxed max-w-lg mx-auto">
            Welcome, <span className="text-brand-dark font-bold">{candidate?.full_name}</span>. Please complete the form below to proceed with your onboarding.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* KTP Upload Section - First */}
          <Card>
            <CardBody className="space-y-8">
              <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline border-b border-brand/10 pb-4">1. Upload KTP Document</h3>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Upload your KTP (Indonesian ID Card) to automatically fill in your personal information below.
                </p>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={handleKtpFileChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 file:cursor-pointer"
                      disabled={uploadingKtp || ktpUploaded}
                    />
                    <p className="mt-1 text-xs text-slate-500">Accepted formats: JPEG, PNG, WebP, PDF (Max 5MB)</p>
                  </div>
                  {ktpFile && !ktpUploaded && (
                    <Button
                      type="button"
                      onClick={handleKtpUpload}
                      disabled={uploadingKtp}
                      className="px-4 py-2"
                    >
                      {uploadingKtp ? 'Processing...' : 'Upload & Extract'}
                    </Button>
                  )}
                  {ktpUploaded && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Uploaded & Extracted</span>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Personal Section */}
          <Card>
            <CardBody className="space-y-8">
              <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline border-b border-brand/10 pb-4">2. Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="ID Number (KTP)" name="id_number" value={formData.id_number} onChange={handleInputChange} required placeholder="16-digit ID number" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Place of Birth" name="place_of_birth" value={formData.place_of_birth} onChange={handleInputChange} required placeholder="City" />
                  <Input label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} required />
                </div>
                <Select label="Gender" name="gender" value={formData.gender} onChange={handleInputChange} required>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Select>
                <Input label="Religion" name="religion" value={formData.religion} onChange={handleInputChange} required placeholder="e.g. Islam, Christian" />
                <Select label="Marital Status" name="marital_status" value={formData.marital_status} onChange={handleInputChange} required>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                </Select>
                <Input label="NPWP Number" name="npwp_number" value={formData.npwp_number} onChange={handleInputChange} placeholder="Tax ID (optional)" />
                <div className="md:col-span-2">
                  <Textarea label="Current Address" name="address" value={formData.address} onChange={handleInputChange} required rows={3} placeholder="Full residential address..." />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Financial Section */}
          <Card>
            <CardBody className="space-y-8">
              <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline border-b border-brand/10 pb-4">3. Bank Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Bank Name" name="bank_name" value={formData.bank_name} onChange={handleInputChange} required placeholder="e.g. BCA, Mandiri" />
                  <Input label="Account Number" name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} required placeholder="0000000000" />
                  <div className="md:col-span-2">
                  <Input label="Account Holder Name" name="bank_account_holder" value={formData.bank_account_holder} onChange={handleInputChange} required placeholder="Name as shown in bank book" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardBody className="space-y-8">
              <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] font-headline border-b border-brand/10 pb-4">4. Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Contact Name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} required placeholder="Full name" />
                <Input label="Relationship" name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleInputChange} required placeholder="e.g. Spouse, Parent" />
                <div className="md:col-span-2">
                  <Input label="Contact Phone" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleInputChange} required placeholder="+62..." />
                </div>
              </div>
            </CardBody>
          </Card>
          
          <div className="pt-6">
            <Button type="submit" disabled={submitting} className="w-full py-5 text-lg shadow-2xl shadow-brand/20">
              {submitting ? 'Submitting Information...' : 'Complete Onboarding Submission'}
            </Button>
            <p className="mt-6 text-center text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">
              Secure Submission • Sigma Solusi Servis
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
