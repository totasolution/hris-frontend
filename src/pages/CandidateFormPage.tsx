import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import * as api from '../services/api';

/** Safe internal path for redirect (starts with /, no protocol or external link). */
function getReturnPath(search: string): string | null {
  const returnTo = new URLSearchParams(search).get('return');
  if (!returnTo || !returnTo.startsWith('/') || returnTo.includes('://') || returnTo.startsWith('//')) {
    return null;
  }
  return returnTo;
}

export default function CandidateFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const returnTo = getReturnPath(location.search);
  const isEdit = id !== 'new' && id != null;
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [screeningStatus, setScreeningStatus] = useState('new');
  const [screeningNotes, setScreeningNotes] = useState('');
  const [screeningRating, setScreeningRating] = useState<string>('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState('');
  const [clients, setClients] = useState<api.Client[]>([]);
  const [projects, setProjects] = useState<api.Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [cList, pList] = await Promise.all([api.getClients(), api.getProjects()]);
        setClients(cList);
        setProjects(pList);
        
        if (isEdit && id) {
          const c = await api.getCandidate(parseInt(id, 10));
          setFullName(c.full_name);
          setEmail(c.email);
          setPhone(c.phone ?? '');
          setClientId(c.client_id ? String(c.client_id) : '');
          setProjectId(c.project_id ? String(c.project_id) : '');
          setScreeningStatus(c.screening_status ?? 'new');
          setScreeningNotes(c.screening_notes ?? '');
          setScreeningRating(c.screening_rating != null ? String(c.screening_rating) : '');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [isEdit, id]);

  const filteredProjects = projects.filter(p => !clientId || String(p.client_id) === clientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isEdit && !cvFile) {
      setError('CV / resume is required when creating a candidate. Please upload a PDF or document.');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        client_id: clientId ? parseInt(clientId, 10) : undefined,
        project_id: projectId ? parseInt(projectId, 10) : undefined,
        ...(isEdit && {
          screening_status: screeningStatus,
          screening_notes: screeningNotes.trim() || undefined,
          screening_rating: screeningRating ? parseInt(screeningRating, 10) : undefined,
        }),
      };
      if (isEdit && id) {
        await api.updateCandidate(parseInt(id, 10), body);
      } else {
        const created = await api.createCandidate(body);
        if (cvFile) {
          await api.uploadCandidateDocument(created.id, cvFile, 'cv');
        }
      }
      navigate(returnTo ?? '/candidates', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
      setCvFileName(file.name);
    } else {
      setCvFile(null);
      setCvFileName('');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title={isEdit ? 'Edit Candidate' : 'New Candidate'}
        subtitle={isEdit ? `Updating profile for ${fullName}` : 'Add a new candidate to the pipeline'}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter full name"
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
              />
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62..."
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Client"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setProjectId(''); // Reset project when client changes
                  }}
                >
                  <option value="">Select Client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </Select>
                <Select
                  label="Project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={!clientId}
                >
                  <option value="">Select Project</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  CV / Resume <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Upload the candidate&apos;s CV or resume (PDF, DOC, or DOCX). Required when creating a new candidate.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleCvChange}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                  />
                  {cvFileName && (
                    <span className="text-sm text-slate-600 font-medium truncate max-w-[200px]" title={cvFileName}>
                      {cvFileName}
                    </span>
                  )}
                </div>
                {!cvFile && (
                  <p className="text-xs text-amber-600 font-medium">Please select a file to continue.</p>
                )}
              </div>
            )}

            {isEdit && (
              <div className="pt-6 border-t border-slate-50 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Screening Status"
                    value={screeningStatus}
                    onChange={(e) => setScreeningStatus(e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="screening">Screening</option>
                    <option value="screened_pass">Screened Pass</option>
                    <option value="screened_fail">Screened Fail</option>
                    <option value="submitted">Submitted</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                  <Input
                    label="Rating (1–5)"
                    type="number"
                    min={1}
                    max={5}
                    value={screeningRating}
                    onChange={(e) => setScreeningRating(e.target.value)}
                  />
                </div>
                <Textarea
                  label="Screening Notes"
                  value={screeningNotes}
                  onChange={(e: any) => setScreeningNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any internal notes about the candidate..."
                />
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Candidate'}
              </Button>
              <Link
                to={returnTo ?? '/candidates'}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
