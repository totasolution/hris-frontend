import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import * as api from '../services/api';

/** Safe internal path for redirect (starts with /, no protocol or external link). */
function getReturnPath(search: string): string | null {
  const returnTo = new URLSearchParams(search).get('return');
  if (!returnTo || !returnTo.startsWith('/') || returnTo.includes('://') || returnTo.startsWith('//')) {
    return null;
  }
  return returnTo;
}

export default function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const returnTo = getReturnPath(location.search);
  const isEdit = id !== 'new' && id != null;
  const navigate = useNavigate();
  const toast = useToast();

  // Basic
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [employeeType, setEmployeeType] = useState('external');
  const [status, setStatus] = useState('active');
  const [hireDate, setHireDate] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');

  // Termination
  const [terminationType, setTerminationType] = useState('');
  const [terminationDate, setTerminationDate] = useState('');
  const [terminationReason, setTerminationReason] = useState('');

  // Personal
  const [identificationId, setIdentificationId] = useState('');
  const [idExpiredDate, setIdExpiredDate] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [religion, setReligion] = useState('');

  // Financial
  const [npwp, setNpwp] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');

  // Emergency
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Address
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [departments, setDepartments] = useState<api.Department[]>([]);
  const [projects, setProjects] = useState<api.Project[]>([]);
  const [clients, setClients] = useState<api.Client[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getDepartments(),
      api.getProjects(),
      api.getClients(),
    ]).then(([d, p, c]) => {
      setDepartments(d);
      setProjects(p);
      setClients(c);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit || !id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const e = await api.getEmployee(parseInt(id, 10));
        setFullName(e.full_name);
        setEmail(e.email);
        setCompanyEmail(e.company_email ?? '');
        setPhone(e.phone ?? '');
        setEmployeeNumber(e.employee_number ?? '');
        setEmployeeType(e.employee_type ?? 'external');
        setStatus(e.status ?? 'active');
        setHireDate(e.hire_date?.slice(0, 10) ?? '');
        setJoinDate(e.join_date?.slice(0, 10) ?? '');
        setDepartmentId(e.department_id ? String(e.department_id) : '');
        setProjectId(e.project_id ? String(e.project_id) : '');
        setClientId(e.client_id ? String(e.client_id) : '');
        setTerminationType(e.termination_type ?? '');
        setTerminationDate(e.termination_date?.slice(0, 10) ?? '');
        setTerminationReason(e.termination_reason ?? '');
        setIdentificationId(e.identification_id ?? '');
        setIdExpiredDate(e.id_expired_date?.slice(0, 10) ?? '');
        setBirthdate(e.birthdate?.slice(0, 10) ?? '');
        setPlaceOfBirth(e.place_of_birth ?? '');
        setGender(e.gender ?? '');
        setMaritalStatus(e.marital_status ?? '');
        setReligion(e.religion ?? '');
        setNpwp(e.npwp ?? '');
        setBankName(e.bank_name ?? '');
        setBankAccount(e.bank_account ?? '');
        setBankAccountHolder(e.bank_account_holder ?? '');
        setEmergencyContact(e.emergency_contact ?? '');
        setEmergencyPhone(e.emergency_phone ?? '');
        setAddress(e.address ?? '');
        setVillage(e.village ?? '');
        setSubDistrict(e.sub_district ?? '');
        setDistrict(e.district ?? '');
        setProvince(e.province ?? '');
        setZipCode(e.zip_code ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body: Parameters<typeof api.updateEmployee>[1] = {
        full_name: fullName.trim(),
        email: email.trim(),
        company_email: companyEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        employee_number: employeeNumber.trim() || undefined,
        employee_type: employeeType,
        status,
        hire_date: hireDate || undefined,
        join_date: joinDate || undefined,
        department_id: departmentId ? parseInt(departmentId, 10) : undefined,
        project_id: projectId ? parseInt(projectId, 10) : undefined,
        client_id: clientId ? parseInt(clientId, 10) : undefined,
        termination_type: terminationType || undefined,
        termination_date: terminationDate || undefined,
        termination_reason: terminationReason.trim() || undefined,
        identification_id: identificationId.trim() || undefined,
        id_expired_date: idExpiredDate || undefined,
        birthdate: birthdate || undefined,
        place_of_birth: placeOfBirth.trim() || undefined,
        gender: gender || undefined,
        marital_status: maritalStatus.trim() || undefined,
        religion: religion.trim() || undefined,
        npwp: npwp.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        bank_account: bankAccount.trim() || undefined,
        bank_account_holder: bankAccountHolder.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        emergency_phone: emergencyPhone.trim() || undefined,
        address: address.trim() || undefined,
        village: village.trim() || undefined,
        sub_district: subDistrict.trim() || undefined,
        district: district.trim() || undefined,
        province: province.trim() || undefined,
        zip_code: zipCode.trim() || undefined,
      };
      if (isEdit && id) {
        await api.updateEmployee(parseInt(id, 10), body);
      } else {
        await api.createEmployee({ ...body, full_name: fullName.trim(), email: email.trim() });
      }
      toast.success(isEdit ? 'Employee updated' : 'Employee created');
      navigate(returnTo ?? '/employees', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      toast.error('Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  const isOffboarded = status === 'terminated' || status === 'resigned' || status === 'contract_ended';
  const filteredProjects = projects.filter((p) => !clientId || String(p.client_id) === clientId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-body">
      <PageHeader
        title={isEdit ? 'Edit Employee' : 'New Employee'}
        subtitle={isEdit ? `Managing profile for ${fullName || 'Employee'}` : 'Add a new employee to the directory'}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Basic Information
            </h3>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter full name"
              />
              <Input
                label="Employee Number"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="Optional"
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
                label="Company Email"
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="Optional"
              />
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62..."
              />
              <Select
                label="Employee Type"
                value={employeeType}
                onChange={(e) => setEmployeeType(e.target.value)}
              >
                <option value="internal">Internal Staff</option>
                <option value="external">External Contractor</option>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Employment Status */}
        <Card>
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Employment Status
            </h3>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Current Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="terminated">Terminated</option>
                <option value="resigned">Resigned</option>
                <option value="contract_ended">Contract Ended</option>
              </Select>
              <Input
                label="Hire Date"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
              />
              <Input
                label="Join Date"
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                placeholder="First working day"
              />
              <Select
                label="Department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">— Select —</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)}>{d.name}</option>
                ))}
              </Select>
              <Select
                label="Client"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setProjectId('');
                }}
              >
                <option value="">— Select —</option>
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
                <option value="">— Select —</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </Select>
            </div>
            {isOffboarded && (
              <div className="pt-6 border-t border-slate-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Termination Type"
                    value={terminationType}
                    onChange={(e) => setTerminationType(e.target.value)}
                  >
                    <option value="">Select Type</option>
                    <option value="termination">Company Termination</option>
                    <option value="resignation">Employee Resignation</option>
                    <option value="contract_end">Contract End</option>
                  </Select>
                  <Input
                    label="Termination Date"
                    type="date"
                    value={terminationDate}
                    onChange={(e) => setTerminationDate(e.target.value)}
                  />
                </div>
                <Textarea
                  label="Termination Reason"
                  value={terminationReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTerminationReason(e.target.value)}
                  rows={3}
                  placeholder="Provide details for offboarding..."
                />
              </div>
            )}
          </CardBody>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Personal Information
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="ID Number (KTP)"
                value={identificationId}
                onChange={(e) => setIdentificationId(e.target.value)}
                placeholder="NIK"
              />
              <Input
                label="ID Expired Date"
                type="date"
                value={idExpiredDate}
                onChange={(e) => setIdExpiredDate(e.target.value)}
              />
              <Input
                label="Place of Birth"
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
              />
              <Input
                label="Date of Birth"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
              <Select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
              <Input
                label="Marital Status"
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                placeholder="e.g. Single, Married"
              />
              <Input
                label="Religion"
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                placeholder="e.g. Islam, Christian"
              />
            </div>
          </CardBody>
        </Card>

        {/* Financial & Tax */}
        <Card>
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Financial & Tax
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="NPWP"
                value={npwp}
                onChange={(e) => setNpwp(e.target.value)}
                placeholder="Tax ID Number"
              />
              <Input
                label="Bank Name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. BCA, Mandiri"
              />
              <Input
                label="Bank Account Number"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
              />
              <Input
                label="Bank Account Holder"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                className="md:col-span-2"
              />
            </div>
          </CardBody>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Emergency Contact
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Contact Name"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
              />
              <Input
                label="Contact Phone"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+62..."
              />
            </div>
          </CardBody>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Address
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Textarea
                label="Street Address"
                value={address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)}
                rows={2}
                className="md:col-span-2"
              />
              <Input
                label="Kelurahan / Village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
              />
              <Input
                label="Kecamatan / Sub-District"
                value={subDistrict}
                onChange={(e) => setSubDistrict(e.target.value)}
              />
              <Input
                label="Kabupaten / Kota"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
              <Input
                label="Province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
              <Input
                label="Zip Code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="e.g. 12345"
              />
            </div>
          </CardBody>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
          </Button>
          <Link
            to={returnTo ?? '/employees'}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

    </div>
  );
}
