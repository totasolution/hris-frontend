import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { useAuth } from '../contexts/AuthContext';
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
  const { permissions = [] } = useAuth();
  const canCreateCandidate = permissions.includes('candidate:create');
  const canEditCandidate = permissions.includes('candidate:update');
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<api.CandidateEmploymentType | ''>('');
  const [ojtOption, setOjtOption] = useState(false);
  const [position, setPosition] = useState('');
  const [placementLocation, setPlacementLocation] = useState('');
  const [screeningStatus, setScreeningStatus] = useState('new');
  const [screeningNotes, setScreeningNotes] = useState('');
  const [screeningRating, setScreeningRating] = useState<string>('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState('');
  const [clients, setClients] = useState<api.Client[]>([]);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [provinceId, setProvinceId] = useState<string>('');
  const [districtId, setDistrictId] = useState<string>('');
  const [subDistrictId, setSubDistrictId] = useState<string>('');
  const [branch, setBranch] = useState('');
  const [regionProvinces, setRegionProvinces] = useState<api.RegionItem[]>([]);
  const [districts, setDistricts] = useState<api.RegionItem[]>([]);
  const [subDistricts, setSubDistricts] = useState<api.RegionItem[]>([]);
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [subDistrictSearch, setSubDistrictSearch] = useState('');
  const [subDistrictDropdownOpen, setSubDistrictDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [cList, regionProvincesList] = await Promise.all([
          api.getClients({ activeOnly: true }),
          api.getRegionsProvinces().catch(() => []),
        ]);
        setClients(cList);
        setRegionProvinces(regionProvincesList);

        if (isEdit && id) {
          const c = await api.getCandidate(parseInt(id, 10));
          setFullName(c.full_name);
          setEmail(c.email);
          setPhone(c.phone ?? '');
          setClientId(c.client_id ? String(c.client_id) : '');
          setEmploymentType((c.employment_type as api.CandidateEmploymentType) ?? '');
          setOjtOption(c.ojt_option ?? false);
          setPosition(c.position ?? '');
          setProvinceId(c.province_id ?? '');
          setDistrictId(c.district_id ?? '');
          setSubDistrictId(c.sub_district_id ?? '');
          setBranch(c.branch ?? '');
          setScreeningStatus(c.screening_status ?? 'new');
          setScreeningNotes(c.screening_notes ?? '');
          setScreeningRating(c.screening_rating != null ? String(c.screening_rating) : '');
          setPlacementLocation(c.placement_location ?? '');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [isEdit, id]);

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      setDistrictId('');
      setSubDistrictId('');
      setSubDistricts([]);
      return;
    }
    api.getRegionsDistricts(provinceId).then((list) => {
      setDistricts(list);
      setDistrictId((prev) => (list.some((d) => d.id === prev) ? prev : ''));
      // Don't clear subDistrictId here so edit-mode restore keeps it; districtId effect will clear if districtId changed
    }).catch(() => { setDistricts([]); setDistrictId(''); setSubDistrictId(''); setSubDistricts([]); });
  }, [provinceId]);

  useEffect(() => {
    if (!districtId) {
      setSubDistricts([]);
      setSubDistrictId('');
      return;
    }
    api.getRegionsSubDistricts(districtId).then((list) => {
      setSubDistricts(list);
      setSubDistrictId((prev) => (list.some((s) => s.id === prev) ? prev : ''));
    }).catch(() => { setSubDistricts([]); setSubDistrictId(''); });
  }, [districtId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!districtId.trim()) {
      setError('District is required.');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        client_id: clientId ? parseInt(clientId, 10) : undefined,
        ojt_option: ojtOption,
        position: position.trim() || undefined,
        placement_location: placementLocation.trim() || undefined,
        province_id: provinceId.trim() || undefined,
        district_id: districtId.trim(),
        sub_district_id: subDistrictId.trim() || undefined,
        branch: branch.trim() || undefined,
        // Always send employment_type on edit so the backend persists it (value or null to clear)
        ...(isEdit && {
          employment_type: employmentType || null,
          screening_status: screeningStatus,
          screening_notes: screeningNotes.trim() || undefined,
          screening_rating: screeningRating ? parseInt(screeningRating, 10) : undefined,
        }),
        ...(!isEdit && { employment_type: employmentType || undefined }),
      };
      if (isEdit && id) {
        await api.updateCandidate(parseInt(id, 10), body);
      } else {
        const createBody = { ...body, employment_type: body.employment_type ?? undefined, district_id: body.district_id };
        const created = await api.createCandidate(createBody);
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  // Basic permission guard on the form route itself
  if (!isEdit && !canCreateCandidate) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800">Access denied</h2>
            <p className="text-sm text-slate-600">
              You do not have permission to create candidates.
            </p>
            <div>
              <ButtonLink to={returnTo ?? '/candidates'}>Back to candidates</ButtonLink>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (isEdit && !canEditCandidate) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800">Access denied</h2>
            <p className="text-sm text-slate-600">
              You do not have permission to edit candidates.
            </p>
            <div>
              <ButtonLink to={returnTo ?? '/candidates'}>Back to candidates</ButtonLink>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

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
              <Select
                label="Client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </Select>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Employment Type"
                value={employmentType}
                onChange={(e) => setEmploymentType((e.target.value || '') as api.CandidateEmploymentType | '')}
              >
                <option value="">Select type</option>
                <option value="pkwt">PKWT</option>
                <option value="partnership">Mitra Kerja</option>
              </Select>
              <Input
                label="Position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Placement Location (Province)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={provinceDropdownOpen ? provinceSearch : placementLocation}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProvinceSearch(v);
                      if (!provinceDropdownOpen) setProvinceDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setProvinceSearch(placementLocation);
                      setProvinceDropdownOpen(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setPlacementLocation((prev) => provinceSearch.trim() || prev);
                        setProvinceDropdownOpen(false);
                      }, 150);
                    }}
                    placeholder="Search or type province..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  />
                  {provinceDropdownOpen && (
                    <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                      {regionProvinces
                        .filter(
                          (p) =>
                            !provinceSearch.trim() ||
                            p.name.toLowerCase().includes(provinceSearch.trim().toLowerCase())
                        )
                        .slice(0, 50)
                        .map((p) => (
                          <li
                            key={p.id}
                            role="option"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setPlacementLocation(p.name);
                              setProvinceId(p.id);
                              setProvinceSearch('');
                              setProvinceDropdownOpen(false);
                            }}
                            className="px-4 py-2 text-sm text-slate-800 hover:bg-brand/10 cursor-pointer"
                          >
                            {p.name}
                          </li>
                        ))}
                      {regionProvinces.filter(
                        (p) =>
                          !provinceSearch.trim() ||
                          p.name.toLowerCase().includes(provinceSearch.trim().toLowerCase())
                      ).length === 0 && (
                        <li className="px-4 py-2 text-sm text-slate-500">No province found</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  District <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={districtDropdownOpen ? districtSearch : (districts.find((d) => d.id === districtId)?.name ?? '')}
                    onChange={(e) => {
                      setDistrictSearch(e.target.value);
                      if (!districtDropdownOpen) setDistrictDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setDistrictSearch(districts.find((d) => d.id === districtId)?.name ?? '');
                      setDistrictDropdownOpen(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setDistrictDropdownOpen(false), 150);
                    }}
                    placeholder="Search or select district..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  />
                  {districtDropdownOpen && provinceId && (
                    <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                      {districts
                        .filter(
                          (d) =>
                            !districtSearch.trim() ||
                            d.name.toLowerCase().includes(districtSearch.trim().toLowerCase())
                        )
                        .slice(0, 50)
                        .map((d) => (
                          <li
                            key={d.id}
                            role="option"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setDistrictId(d.id);
                              setDistrictSearch('');
                              setDistrictDropdownOpen(false);
                            }}
                            className="px-4 py-2 text-sm text-slate-800 hover:bg-brand/10 cursor-pointer"
                          >
                            {d.name}
                          </li>
                        ))}
                      {districts.filter(
                        (d) =>
                          !districtSearch.trim() ||
                          d.name.toLowerCase().includes(districtSearch.trim().toLowerCase())
                      ).length === 0 && (
                        <li className="px-4 py-2 text-sm text-slate-500">No district found</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ojt_option"
                  checked={ojtOption}
                  onChange={(e) => setOjtOption(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <label htmlFor="ojt_option" className="text-sm font-medium text-slate-700">
                  This candidate is open for OJT (On Job Training) option
                </label>
              </div>

            </div>

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
                    <option value="interview_scheduled">Interviewing</option>
                    <option value="interview_passed">Interview Passed</option>
                    <option value="interview_failed">Interview Failed</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="onboarding_completed">Onboarding Done</option>
                    <option value="ojt">OJT</option>
                    <option value="contract_requested">Contract Requested</option>
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
