import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

type EmployeeType = 'internal' | 'external';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { RegionSelect } from '../components/RegionSelect';
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

/** Get employee type from URL path (e.g. /employees/internal/new -> internal). */
function getEmployeeTypeFromPath(pathname: string): EmployeeType {
  if (pathname.includes('/employees/internal/')) return 'internal';
  return 'external';
}

/** Normalize stored marital_status to select value (single | married) for display. */
function normalizeMaritalStatusForSelect(maritalStatus: string): string {
  const lower = maritalStatus.trim().toLowerCase();
  if (lower === 'married' || lower === 'kawin' || lower === 'menikah') return 'married';
  if (lower === 'single' || lower === 'belum kawin' || lower === 'belum menikah') return 'single';
  return maritalStatus.trim() || '';
}

export default function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const returnTo = getReturnPath(location.search);
  const isEdit = id !== 'new' && id != null;
  const employeeTypeFromPath = getEmployeeTypeFromPath(location.pathname);
  const navigate = useNavigate();
  const toast = useToast();

  // Basic
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [employeeType, setEmployeeType] = useState<EmployeeType>(employeeTypeFromPath);
  const [employmentContractType, setEmploymentContractType] = useState('');
  const [status, setStatus] = useState('active');
  const [hireDate, setHireDate] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [clientId, setClientId] = useState('');

  // Offboarding
  const [terminationType, setTerminationType] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [lastWorkingDate, setLastWorkingDate] = useState('');

  // Personal
  const [identificationId, setIdentificationId] = useState('');
  const [idExpiredDate, setIdExpiredDate] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [taxStatus, setTaxStatus] = useState('');
  const [childNumber, setChildNumber] = useState('');
  const [religion, setReligion] = useState('');

  // Financial
  const [npwp, setNpwp] = useState('');
  const [salary, setSalary] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');

  // Emergency
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Address (KTP)
  const [address, setAddress] = useState('');
  const [rtRw, setRtRw] = useState('');
  const [village, setVillage] = useState('');
  const [province, setProvince] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [district, setDistrict] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [zipCode, setZipCode] = useState('');
  // Domicile (structured, same as KTP)
  const [domicileAddress, setDomicileAddress] = useState('');
  const [domicileRtRw, setDomicileRtRw] = useState('');
  const [domicileProvince, setDomicileProvince] = useState('');
  const [domicileProvinceId, setDomicileProvinceId] = useState('');
  const [domicileDistrict, setDomicileDistrict] = useState('');
  const [domicileDistrictId, setDomicileDistrictId] = useState('');
  const [domicileSubDistrict, setDomicileSubDistrict] = useState('');
  const [domicileZipCode, setDomicileZipCode] = useState('');

  // Role & placement
  const [position, setPosition] = useState('');
  const [placementLocation, setPlacementLocation] = useState('');
  const [branch, setBranch] = useState('');

  // BPJS
  const [bpjstkId, setBpjstkId] = useState('');
  const [bpjsksId, setBpjsksId] = useState('');
  const [bpjsBpu, setBpjsBpu] = useState('');
  // Employment allowances
  const [positionalAllowance, setPositionalAllowance] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');
  const [commAllowance, setCommAllowance] = useState('');
  const [miscAllowance, setMiscAllowance] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceNo, setInsuranceNo] = useState('');
  const [overtimeNominal, setOvertimeNominal] = useState('');

  const [departments, setDepartments] = useState<api.Department[]>([]);
  const [clients, setClients] = useState<api.Client[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getDepartments(),
      api.getClients(),
    ]).then(([d, c]) => {
      setDepartments(d);
      setClients(c);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setEmployeeType(employeeTypeFromPath);
    }
  }, [isEdit, employeeTypeFromPath]);

  // Resolve KTP province/district names to IDs so RegionSelect can cascade when editing
  useEffect(() => {
    if (!province?.trim()) {
      setProvinceId('');
      setDistrictId('');
      return;
    }
    api.getRegionsProvinces(province.trim()).then((list) => {
      const first = list[0];
      if (first) setProvinceId(first.id);
    }).catch(() => {});
  }, [province]);
  useEffect(() => {
    if (!provinceId || !district?.trim()) {
      setDistrictId('');
      return;
    }
    api.getRegionsDistricts(provinceId, district.trim()).then((list) => {
      const first = list[0];
      if (first) setDistrictId(first.id);
    }).catch(() => {});
  }, [provinceId, district]);

  // Resolve domicile province/district names to IDs for RegionSelect cascade when editing
  useEffect(() => {
    if (!domicileProvince?.trim()) {
      setDomicileProvinceId('');
      setDomicileDistrictId('');
      return;
    }
    api.getRegionsProvinces(domicileProvince.trim()).then((list) => {
      const first = list[0];
      if (first) setDomicileProvinceId(first.id);
    }).catch(() => {});
  }, [domicileProvince]);
  useEffect(() => {
    if (!domicileProvinceId || !domicileDistrict?.trim()) {
      setDomicileDistrictId('');
      return;
    }
    api.getRegionsDistricts(domicileProvinceId, domicileDistrict.trim()).then((list) => {
      const first = list[0];
      if (first) setDomicileDistrictId(first.id);
    }).catch(() => {});
  }, [domicileProvinceId, domicileDistrict]);

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
        setEmployeeType(
          e.employee_type === 'internal' || e.employee_type === 'external'
            ? e.employee_type
            : 'external',
        );
        setEmploymentContractType(e.employment_contract_type ?? '');
        setStatus(e.status ?? 'active');
        setHireDate(e.hire_date?.slice(0, 10) ?? '');
        setJoinDate(e.join_date?.slice(0, 10) ?? '');
        setDepartmentId(e.department_id ? String(e.department_id) : '');
        setClientId(e.client_id ? String(e.client_id) : '');
        setTerminationType(e.termination_type ?? '');
        setTerminationReason(e.termination_reason ?? '');
        setLastWorkingDate(e.last_working_date?.slice(0, 10) ?? '');
        setIdentificationId(e.identification_id ?? '');
        setIdExpiredDate(e.id_expired_date?.slice(0, 10) ?? '');
        setBirthdate(e.birthdate?.slice(0, 10) ?? '');
        setPlaceOfBirth(e.place_of_birth ?? '');
        setGender(e.gender ?? '');
        setMaritalStatus(normalizeMaritalStatusForSelect(e.marital_status ?? ''));
        setTaxStatus(e.tax_status ?? '');
        setChildNumber(e.child_number != null ? String(e.child_number) : '');
        setReligion(e.religion ?? '');
        setNpwp(e.npwp ?? '');
        setBankName(e.bank_name ?? '');
        setSalary(e.salary ?? '');
        setBankAccount(e.bank_account ?? '');
        setBankAccountHolder(e.bank_account_holder ?? '');
        setEmergencyContact(e.emergency_contact ?? '');
        setEmergencyPhone(e.emergency_phone ?? '');
        setAddress(e.address ?? '');
        setRtRw(e.rt_rw ?? '');
        setVillage(e.village ?? '');
        setProvince(e.province ?? '');
        setDistrict(e.district ?? '');
        setSubDistrict(e.sub_district ?? '');
        setZipCode(e.zip_code ?? '');
        setDomicileAddress(e.domicile_address ?? '');
        setDomicileRtRw(e.domicile_rt_rw ?? '');
        setDomicileProvince(e.domicile_province ?? '');
        setDomicileDistrict(e.domicile_district ?? '');
        setDomicileSubDistrict(e.domicile_sub_district ?? '');
        setDomicileZipCode(e.domicile_zip_code ?? '');
        setPosition(e.position ?? '');
        setPlacementLocation(e.placement_location ?? '');
        setBranch(e.branch ?? '');
        setBpjstkId(e.bpjstk_id ?? '');
        setBpjsksId(e.bpjsks_id ?? '');
        setBpjsBpu(e.bpjs_bpu ?? '');
        setPositionalAllowance(e.positional_allowance ?? '');
        setTransportAllowance(e.transport_allowance ?? '');
        setCommAllowance(e.comm_allowance ?? '');
        setMiscAllowance(e.misc_allowance ?? '');
        setInsuranceProvider(e.insurance_provider ?? '');
        setInsuranceNo(e.insurance_no ?? '');
        setOvertimeNominal(e.overtime_nominal ?? '');
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
        // employee_number is auto-generated on create and read-only on edit; do not send
        employee_type: employeeType,
        employment_contract_type: (employmentContractType === 'pkwt' || employmentContractType === 'partnership') ? employmentContractType : undefined,
        status,
        hire_date: hireDate || undefined,
        join_date: joinDate || undefined,
        department_id: departmentId ? parseInt(departmentId, 10) : undefined,
        client_id: clientId ? parseInt(clientId, 10) : undefined,
        termination_type: terminationType || undefined,
        last_working_date: lastWorkingDate || undefined,
        termination_reason: terminationReason.trim() || undefined,
        identification_id: identificationId.trim() || undefined,
        id_expired_date: idExpiredDate || undefined,
        birthdate: birthdate || undefined,
        place_of_birth: placeOfBirth.trim() || undefined,
        gender: gender || undefined,
        marital_status: maritalStatus.trim() || undefined,
        tax_status: taxStatus.trim() || undefined,
        child_number: childNumber !== '' ? (parseInt(childNumber, 10) || undefined) : undefined,
        religion: religion.trim() || undefined,
        npwp: npwp.trim() || undefined,
        salary: salary.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        bank_account: bankAccount.trim() || undefined,
        bank_account_holder: bankAccountHolder.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        emergency_phone: emergencyPhone.trim() || undefined,
        address: address.trim() || undefined,
        rt_rw: rtRw.trim() || undefined,
        village: village.trim() || undefined,
        province: province.trim() || undefined,
        district: district.trim() || undefined,
        sub_district: subDistrict.trim() || undefined,
        zip_code: zipCode.trim() || undefined,
        domicile_address: domicileAddress.trim() || undefined,
        domicile_rt_rw: domicileRtRw.trim() || undefined,
        domicile_province: domicileProvince.trim() || undefined,
        domicile_district: domicileDistrict.trim() || undefined,
        domicile_sub_district: domicileSubDistrict.trim() || undefined,
        domicile_zip_code: domicileZipCode.trim() || undefined,
        position: position.trim() || undefined,
        placement_location: placementLocation.trim() || undefined,
        branch: branch.trim() || undefined,
        bpjstk_id: bpjstkId.trim() || undefined,
        bpjsks_id: bpjsksId.trim() || undefined,
        bpjs_bpu: bpjsBpu.trim() || undefined,
        positional_allowance: positionalAllowance.trim() || undefined,
        transport_allowance: transportAllowance.trim() || undefined,
        comm_allowance: commAllowance.trim() || undefined,
        misc_allowance: miscAllowance.trim() || undefined,
        insurance_provider: insuranceProvider.trim() || undefined,
        insurance_no: insuranceNo.trim() || undefined,
        overtime_nominal: overtimeNominal.trim() || undefined,
      };
      if (isEdit && id) {
        await api.updateEmployee(parseInt(id, 10), body);
      } else {
        await api.createEmployee({ ...body, full_name: fullName.trim(), email: email.trim() });
      }
      toast.success(isEdit ? 'Employee updated' : 'Employee created');
      const defaultReturn = isEdit
        ? (employeeType === 'internal' ? '/employees/internal' : '/employees/external')
        : (employeeType === 'internal' ? '/employees/internal' : '/employees/external');
      navigate(returnTo ?? defaultReturn, { replace: true });
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
              {isEdit && (
                <Input
                  label="Employee Number"
                  value={employeeNumber}
                  readOnly
                  disabled
                  placeholder="—"
                />
              )}
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
              {isEdit ? (
                <Input
                  label="Employee Type"
                  value={employeeType === 'internal' ? 'Internal Staff' : 'External Contractor'}
                  readOnly
                  disabled
                />
              ) : (
                <Select
                  label="Employee Type"
                  value={employeeType}
                  onChange={(e) => setEmployeeType(e.target.value as EmployeeType)}
                >
                  <option value="internal">Internal Staff</option>
                  <option value="external">External Contractor</option>
                </Select>
              )}
              <Select
                label="Contract Type"
                value={employmentContractType}
                onChange={(e) => setEmploymentContractType(e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="pkwt">PKWT</option>
                <option value="partnership">Mitra Kerja (Partnership)</option>
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
              <Input
                label="Position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
              <Input
                label="Placement Location"
                value={placementLocation}
                onChange={(e) => setPlacementLocation(e.target.value)}
                placeholder="e.g. Jakarta"
              />
              <Input
                label="Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Branch name"
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
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">— Select —</option>
                {clients.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </Select>
            </div>
            {isOffboarded && (
              <div className="pt-6 border-t border-slate-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Offboarding Type"
                    value={terminationType}
                    onChange={(e) => setTerminationType(e.target.value)}
                  >
                    <option value="">Select Type</option>
                    <option value="termination">Company Termination</option>
                    <option value="resignation">Employee Resignation</option>
                    <option value="contract_end">Contract End</option>
                  </Select>
                  <div>
                    <Input
                      label="Last Working Date"
                      type="date"
                      value={lastWorkingDate}
                      onChange={(e) => setLastWorkingDate(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      After this date, employee login will be blocked.
                    </p>
                  </div>
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
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </Select>
              <Select
                label="Marital Status"
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="single">Single / Belum Kawin</option>
                <option value="married">Married / Kawin</option>
                <option value="divorced">Divorced / Cerai</option>
              </Select>
              <Input
                label="Religion"
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                placeholder="e.g. Islam, Christian"
              />
              <Input
                label="Number of Children"
                type="number"
                min={0}
                value={childNumber}
                onChange={(e) => setChildNumber(e.target.value)}
                placeholder="0"
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
                label="Tax Status"
                value={taxStatus}
                onChange={(e) => setTaxStatus(e.target.value)}
                placeholder="e.g. TK/0, TK/1, K/0"
              />
              <Input
                label="NPWP"
                value={npwp}
                onChange={(e) => setNpwp(e.target.value)}
                placeholder="Tax ID Number"
              />
              <Input
                label="Salary"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. 15.000.000"
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
              <Input
                label="BPJS Tenaga Kerja ID"
                value={bpjstkId}
                onChange={(e) => setBpjstkId(e.target.value)}
                placeholder="BPJS TK number"
              />
              <Input
                label="BPJS Kesehatan ID"
                value={bpjsksId}
                onChange={(e) => setBpjsksId(e.target.value)}
                placeholder="BPJS Kesehatan number"
              />
              <Input
                label="BPJS BPU ID"
                value={bpjsBpu}
                onChange={(e) => setBpjsBpu(e.target.value)}
                placeholder="BPJS BPU number"
              />
              <Input
                label="Tunjangan Jabatan"
                value={positionalAllowance}
                onChange={(e) => setPositionalAllowance(e.target.value)}
                placeholder="Positional allowance"
              />
              <Input
                label="Tunjangan Transportasi"
                value={transportAllowance}
                onChange={(e) => setTransportAllowance(e.target.value)}
                placeholder="Transport allowance"
              />
              <Input
                label="Tunjangan Komunikasi"
                value={commAllowance}
                onChange={(e) => setCommAllowance(e.target.value)}
                placeholder="Communication allowance"
              />
              <Input
                label="Tunjangan Lain-lain"
                value={miscAllowance}
                onChange={(e) => setMiscAllowance(e.target.value)}
                placeholder="Misc allowance"
              />
              <Input
                label="Insurance Provider"
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                placeholder="e.g. AXA, Allianz"
              />
              <Input
                label="Insurance No."
                value={insuranceNo}
                onChange={(e) => setInsuranceNo(e.target.value)}
              />
              <Input
                label="Overtime Nominal"
                value={overtimeNominal}
                onChange={(e) => setOvertimeNominal(e.target.value)}
                placeholder="Per hour overtime rate"
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
                label="KTP Address (Street)"
                value={address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)}
                rows={2}
                className="md:col-span-2"
              />
              <Input
                label="RT/RW"
                value={rtRw}
                onChange={(e) => setRtRw(e.target.value)}
                placeholder="e.g. 01/02"
              />
              <Input
                label="Kelurahan / Village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
              />
              <RegionSelect
                label="Province"
                type="province"
                value={province}
                onChange={(name, id) => {
                  setProvince(name);
                  setProvinceId(id ?? '');
                  setDistrict('');
                  setDistrictId('');
                  setSubDistrict('');
                }}
                placeholder="Cari provinsi..."
              />
              <RegionSelect
                label="Kabupaten / Kota"
                type="district"
                provinceId={provinceId}
                value={district}
                onChange={(name, id) => {
                  setDistrict(name);
                  setDistrictId(id ?? '');
                  setSubDistrict('');
                }}
                placeholder="Cari kabupaten/kota..."
              />
              <RegionSelect
                label="Kecamatan / Sub-District"
                type="sub_district"
                districtId={districtId}
                value={subDistrict}
                onChange={(name) => setSubDistrict(name)}
                placeholder="Cari kecamatan..."
              />
              <Input
                label="Zip Code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="e.g. 12345"
              />
              <div className="md:col-span-2 border-t border-slate-200 pt-6 mt-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Domicile Address (Alamat Domisili)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Textarea
                    label="Street (Jalan, Nomor)"
                    value={domicileAddress}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDomicileAddress(e.target.value)}
                    rows={2}
                    className="md:col-span-2"
                    placeholder="Alamat jalan dan nomor rumah domisili"
                  />
                  <Input
                    label="RT/RW"
                    value={domicileRtRw}
                    onChange={(e) => setDomicileRtRw(e.target.value)}
                    placeholder="e.g. 01/02"
                  />
                  <RegionSelect
                    label="Province"
                    type="province"
                    value={domicileProvince}
                    onChange={(name, id) => {
                      setDomicileProvince(name);
                      setDomicileProvinceId(id ?? '');
                      setDomicileDistrict('');
                      setDomicileDistrictId('');
                      setDomicileSubDistrict('');
                    }}
                    placeholder="Cari provinsi..."
                  />
                  <RegionSelect
                    label="Kabupaten / Kota"
                    type="district"
                    provinceId={domicileProvinceId}
                    value={domicileDistrict}
                    onChange={(name, id) => {
                      setDomicileDistrict(name);
                      setDomicileDistrictId(id ?? '');
                      setDomicileSubDistrict('');
                    }}
                    placeholder="Cari kabupaten/kota..."
                  />
                  <RegionSelect
                    label="Kecamatan / Sub-District"
                    type="sub_district"
                    districtId={domicileDistrictId}
                    value={domicileSubDistrict}
                    onChange={(name) => setDomicileSubDistrict(name)}
                    placeholder="Cari kecamatan..."
                  />
                  <Input
                    label="Zip Code"
                    value={domicileZipCode}
                    onChange={(e) => setDomicileZipCode(e.target.value)}
                    placeholder="e.g. 12345"
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
          </Button>
          <Link
            to={returnTo ?? (employeeType === 'internal' ? '/employees/internal' : '/employees/external')}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

    </div>
  );
}
