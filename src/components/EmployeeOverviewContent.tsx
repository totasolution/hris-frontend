import { useEffect, useState, type ReactNode } from 'react';
import type { Employee, Department, Client, EmployeeEducation, EmployeeFamily } from '../services/api';
import { Card, CardBody, CardHeader } from './Card';
import { formatDate } from '../utils/formatDate';
import { formatGender } from '../utils/formatGender';
import { useToast } from './Toast';
import * as api from '../services/api';

export function EmployeeOverviewContent({
  employee: employeeProp,
  departments = [],
  clients = [],
  canEdit = false,
}: {
  employee: Employee;
  departments?: Department[];
  clients?: Client[];
  canEdit?: boolean;
}) {
  const toast = useToast();
  const [employee, setEmployee] = useState<Employee>(employeeProp);
  const displayDate = employee.join_date || employee.hire_date;
  const [education, setEducation] = useState<EmployeeEducation>({});
  const [family, setFamily] = useState<EmployeeFamily>({});
  const [educationLoading, setEducationLoading] = useState(false);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [educationEditing, setEducationEditing] = useState(false);
  const [familyEditing, setFamilyEditing] = useState(false);
  const [educationSaving, setEducationSaving] = useState(false);
  const [familySaving, setFamilySaving] = useState(false);
  const [employeeInfoEditing, setEmployeeInfoEditing] = useState(false);
  const [employeeInfoSaving, setEmployeeInfoSaving] = useState(false);
  const [personalEditing, setPersonalEditing] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [financialEditing, setFinancialEditing] = useState(false);
  const [financialSaving, setFinancialSaving] = useState(false);
  const [emergencyEditing, setEmergencyEditing] = useState(false);
  const [emergencySaving, setEmergencySaving] = useState(false);
  const [addressEditing, setAddressEditing] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);

  const contractTypeLabel =
    employee.employment_contract_type === 'pkwt'
      ? 'PKWT'
      : employee.employment_contract_type === 'partnership'
        ? 'Mitra Kerja'
        : employee.employment_contract_type ?? '—';

  useEffect(() => {
    setEmployee(employeeProp);
  }, [employeeProp]);

  const handleSaveEmployeeInfo = async (payload: api.EmployeeInformationPayload) => {
    setEmployeeInfoSaving(true);
    try {
      const updated = await api.updateEmployeeInformation(employee.id, payload);
      setEmployee(updated);
      setEmployeeInfoEditing(false);
      toast.success('Employee information updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update employee information');
    } finally {
      setEmployeeInfoSaving(false);
    }
  };

  const handleSavePersonal = async (payload: api.EmployeePersonalPayload) => {
    setPersonalSaving(true);
    try {
      const updated = await api.updatePersonalInformation(employee.id, payload);
      setEmployee(updated);
      setPersonalEditing(false);
      toast.success('Personal information updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update personal information');
    } finally {
      setPersonalSaving(false);
    }
  };

  const handleSaveFinancial = async (payload: api.EmployeeFinancialPayload) => {
    setFinancialSaving(true);
    try {
      const updated = await api.updateFinancialInformation(employee.id, payload);
      setEmployee(updated);
      setFinancialEditing(false);
      toast.success('Financial information updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update financial information');
    } finally {
      setFinancialSaving(false);
    }
  };

  const handleSaveEmergency = async (payload: api.EmployeeEmergencyPayload) => {
    setEmergencySaving(true);
    try {
      const updated = await api.updateEmergencyContact(employee.id, payload);
      setEmployee(updated);
      setEmergencyEditing(false);
      toast.success('Emergency contact updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update emergency contact');
    } finally {
      setEmergencySaving(false);
    }
  };

  const handleSaveAddress = async (payload: api.EmployeeAddressPayload) => {
    setAddressSaving(true);
    try {
      const updated = await api.updateAddressInformation(employee.id, payload);
      setEmployee(updated);
      setAddressEditing(false);
      toast.success('Address information updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update address information');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleSaveEducation = async (payload: EmployeeEducation) => {
    setEducationSaving(true);
    try {
      const updated = await api.updateEmployeeEducation(employee.id, payload);
      setEducation(updated ?? {});
      setEducationEditing(false);
      toast.success('Education updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update education');
    } finally {
      setEducationSaving(false);
    }
  };

  const handleSaveFamily = async (payload: EmployeeFamily) => {
    setFamilySaving(true);
    try {
      const updated = await api.updateEmployeeFamily(employee.id, payload);
      setFamily(updated ?? {});
      setFamilyEditing(false);
      toast.success('Family updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update family');
    } finally {
      setFamilySaving(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadDetails = async () => {
      setEducationLoading(true);
      setFamilyLoading(true);
      try {
        const [educationData, familyData] = await Promise.all([
          api.getEmployeeEducation(employee.id).catch(() => ({})),
          api.getEmployeeFamily(employee.id).catch(() => ({})),
        ]);
        if (!active) return;
        setEducation(educationData ?? {});
        setFamily(familyData ?? {});
      } finally {
        if (!active) return;
        setEducationLoading(false);
        setFamilyLoading(false);
      }
    };
    void loadDetails();
    return () => {
      active = false;
    };
  }, [employee.id]);

  return (
    <div className="space-y-8">
      {/* Employee Information */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Employee Information
          </h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEmployeeInfoEditing((v) => !v)}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
            >
              {employeeInfoEditing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </CardHeader>
        <CardBody>
          {employeeInfoEditing ? (
            <EmployeeInfoForm
              initial={employee}
              saving={employeeInfoSaving}
              onCancel={() => setEmployeeInfoEditing(false)}
              onSave={handleSaveEmployeeInfo}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Employee Status">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    employee.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : employee.status === 'terminated'
                        ? 'bg-red-100 text-red-700'
                        : employee.status === 'resigned'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {(employee.status ?? '—').replace(/_/g, ' ')}
                </span>
              </Field>
              <Field label="Employee Type" value={employee.employee_type} />
              <Field label="Contract Type" value={contractTypeLabel} />
              <Field
                label="Contract duration"
                value={
                  employee.contract_duration_months != null && employee.contract_duration_months > 0
                    ? `${employee.contract_duration_months} months`
                    : '—'
                }
              />
              <Field label="NIP / Employee number" value={employee.employee_number} />
              <Field label="Email" value={employee.email} />
              <Field label="Company Email" value={employee.company_email} />
              <Field label="Phone Number" value={employee.phone} />
              <Field label="Hire Date" value={employee.hire_date ? formatDate(employee.hire_date) : '—'} />
              <Field label="Join Date" value={displayDate ? formatDate(displayDate) : '—'} />
              <Field label="Position" value={employee.position} />
              <Field label="Placement Location" value={employee.placement_location} />
              <Field label="Branch" value={employee.branch} />
              <Field
                label="Department"
                value={
                  employee.department_id != null
                    ? departments.find((d) => d.id === employee.department_id)?.name ?? `ID: ${employee.department_id}`
                    : '—'
                }
              />
              <Field
                label="Client"
                value={
                  employee.client_id != null
                    ? clients.find((c) => c.id === employee.client_id)?.name ?? `ID: ${employee.client_id}`
                    : '—'
                }
              />
              <Field
                label="Last Working Date"
                value={employee.last_working_date ? formatDate(employee.last_working_date) : '—'}
              />
              <Field
                label="Offboarding Type"
                value={employee.termination_type ? String(employee.termination_type).replace(/_/g, ' ') : '—'}
              />
              <div className="md:col-span-2">
                <Field
                  label="Termination Reason"
                  value={employee.termination_reason}
                  block
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Personal Information
          </h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => setPersonalEditing((v) => !v)}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
            >
              {personalEditing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </CardHeader>
        <CardBody>
          {personalEditing ? (
            <PersonalInfoForm
              initial={employee}
              saving={personalSaving}
              onCancel={() => setPersonalEditing(false)}
              onSave={handleSavePersonal}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="ID Number (KTP)" value={employee.identification_id} />
              <Field
                label="ID Expired Date"
                value={employee.id_expired_date ? formatDate(employee.id_expired_date) : '—'}
              />
              <Field label="Place of Birth" value={employee.place_of_birth} />
              <Field
                label="Date of Birth"
                value={employee.birthdate ? formatDate(employee.birthdate) : '—'}
              />
              <Field label="Gender" value={employee.gender ? formatGender(employee.gender) : '—'} />
              <Field label="Religion" value={employee.religion} />
              <Field label="Marital Status" value={employee.marital_status} />
              <Field
                label="Number of Children"
                value={employee.child_number != null ? String(employee.child_number) : '—'}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Education
          </h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEducationEditing((v) => !v)}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
            >
              {educationEditing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </CardHeader>
        <CardBody>
          {educationLoading ? (
            <p className="text-sm text-slate-500">Loading education...</p>
          ) : educationEditing ? (
            <EducationForm
              initial={education}
              saving={educationSaving}
              onCancel={() => setEducationEditing(false)}
              onSave={handleSaveEducation}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Pendidikan terakhir" value={education.last_education} />
              <Field label="Jurusan" value={education.major} />
              <Field label="Tahun Lulus" value={education.graduation_year} />
              <Field label="Nama Sekolah" value={education.school_name} />
              <Field label="IPK / Nilai" value={education.gpa} />
              <Field label="Kota" value={education.city} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Family */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Family
          </h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => setFamilyEditing((v) => !v)}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
            >
              {familyEditing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </CardHeader>
        <CardBody>
          {familyLoading ? (
            <p className="text-sm text-slate-500">Loading family...</p>
          ) : familyEditing ? (
            <FamilyForm
              initial={family}
              saving={familySaving}
              onCancel={() => setFamilyEditing(false)}
              onSave={handleSaveFamily}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Nomor Kartu Keluarga" value={family.family_card_number} />
              <Field label="Nama Ayah" value={family.father_name} />
              <Field label="Nama Ibu" value={family.mother_name} />
              <Field label="Nama Istri" value={family.wife_name} />
              <Field label="Nama Anak 1" value={family.child1_name} />
              <Field label="Nama Anak 2" value={family.child2_name} />
              <Field label="Nama Anak 3" value={family.child3_name} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Financial Information
          </h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => setFinancialEditing((v) => !v)}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
            >
              {financialEditing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </CardHeader>
        <CardBody>
          {financialEditing ? (
            <FinancialInfoForm
              initial={employee}
              saving={financialSaving}
              onCancel={() => setFinancialEditing(false)}
              onSave={handleSaveFinancial}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Tax Status" value={employee.tax_status} />
              <Field label="NPWP Number" value={employee.npwp} />
              <Field label="Salary" value={employee.salary} />
              <Field label="Annual Leave Nominal" value={employee.annual_leave_nominal} />
              <Field label="Bank Name" value={employee.bank_name} />
              <Field label="Bank Account Number" value={employee.bank_account} />
              <Field label="Bank Account Holder" value={employee.bank_account_holder} />
              <Field label="BPJS Tenaga Kerja ID" value={employee.bpjstk_id} />
              <Field label="BPJS Kesehatan ID" value={employee.bpjsks_id} />
              <Field label="BPJS BPU ID" value={employee.bpjs_bpu} />
              <Field label="Tunjangan Jabatan" value={employee.positional_allowance} />
              <Field label="Tunjangan Transportasi" value={employee.transport_allowance} />
              <Field label="Tunjangan Komunikasi" value={employee.comm_allowance} />
              <Field label="Tunjangan Lain-lain" value={employee.misc_allowance} />
              <Field label="Insurance Provider" value={employee.insurance_provider} />
              <Field label="Insurance No." value={employee.insurance_no} />
              <Field label="Overtime Nominal" value={employee.overtime_nominal} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Emergency Contact
          </h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEmergencyEditing((v) => !v)}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
            >
              {emergencyEditing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </CardHeader>
        <CardBody>
          {emergencyEditing ? (
            <EmergencyContactForm
              initial={employee}
              saving={emergencySaving}
              onCancel={() => setEmergencyEditing(false)}
              onSave={handleSaveEmergency}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Contact Name" value={employee.emergency_contact} />
              <Field label="Relationship" value={employee.emergency_contact_relationship} />
              <Field label="Contact Phone" value={employee.emergency_phone} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Address Information
          </h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => setAddressEditing((v) => !v)}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
            >
              {addressEditing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </CardHeader>
        <CardBody>
          {addressEditing ? (
            <AddressInfoForm
              initial={employee}
              saving={addressSaving}
              onCancel={() => setAddressEditing(false)}
              onSave={handleSaveAddress}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Address (Street)" value={employee.address} block />
              <Field label="RT/RW" value={employee.rt_rw} />
              <Field label="Kelurahan / Village" value={employee.village} />
              <Field label="Province" value={employee.province} />
              <Field label="Kabupaten / Kota" value={employee.district} />
              <Field label="Kecamatan / Sub-District" value={employee.sub_district} />
              <Field label="Zip Code" value={employee.zip_code} />
              <Field label="Domicile Address (Street)" value={employee.domicile_address} block />
              <Field label="Domicile RT/RW" value={employee.domicile_rt_rw} />
              <Field label="Domicile Province" value={employee.domicile_province} />
              <Field label="Domicile Kabupaten / Kota" value={employee.domicile_district} />
              <Field label="Domicile Kecamatan / Sub-District" value={employee.domicile_sub_district} />
              <Field label="Domicile Zip Code" value={employee.domicile_zip_code} />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  children,
  block,
}: {
  label: string;
  value?: string | null;
  children?: ReactNode;
  block?: boolean;
}) {
  const display: ReactNode = children ?? (value !== undefined && value !== null && String(value).trim() !== '' ? value : '—');
  const isLongText = typeof display === 'string' && (display.includes('\n') || display.length > 80);
  return (
    <div className={block ? 'md:col-span-2' : ''}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">{label}</p>
      {isLongText ? (
        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl whitespace-pre-wrap">
          {display}
        </p>
      ) : (
        <p className="text-sm font-bold text-brand-dark">{display}</p>
      )}
    </div>
  );
}

type EditorProps<TInitial, TPayload = TInitial> = {
  initial: TInitial;
  saving: boolean;
  onCancel: () => void;
  onSave: (payload: TPayload) => Promise<void>;
};

function cleanString(value?: string): string | undefined {
  if (value == null) return undefined;
  const v = value.trim();
  return v === '' ? undefined : v;
}

function InputRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">{label}</p>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
    </label>
  );
}

function DateInputRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-headline">{label}</p>
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
    </label>
  );
}

function parseNumberOrNull(value?: string): number | null {
  const normalized = (value ?? '').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableString(value?: string): string | null {
  return cleanString(value) ?? null;
}

function EmployeeInfoForm({ initial, saving, onCancel, onSave }: EditorProps<Employee, api.EmployeeInformationPayload>) {
  const [form, setForm] = useState({
    employee_number: initial.employee_number ?? '',
    email: initial.email ?? '',
    company_email: initial.company_email ?? '',
    phone: initial.phone ?? '',
    status: initial.status ?? '',
    hire_date: initial.hire_date ?? '',
    join_date: initial.join_date ?? '',
    termination_type: initial.termination_type ?? '',
    last_working_date: initial.last_working_date ?? '',
    termination_reason: initial.termination_reason ?? '',
    position: initial.position ?? '',
    placement_location: initial.placement_location ?? '',
    branch: initial.branch ?? '',
    employment_contract_type: initial.employment_contract_type ?? '',
    contract_duration_months: initial.contract_duration_months != null ? String(initial.contract_duration_months) : '',
    department_id: initial.department_id != null ? String(initial.department_id) : '',
    client_id: initial.client_id != null ? String(initial.client_id) : '',
  });

  useEffect(() => {
    setForm({
      employee_number: initial.employee_number ?? '',
      email: initial.email ?? '',
      company_email: initial.company_email ?? '',
      phone: initial.phone ?? '',
      status: initial.status ?? '',
      hire_date: initial.hire_date ?? '',
      join_date: initial.join_date ?? '',
      termination_type: initial.termination_type ?? '',
      last_working_date: initial.last_working_date ?? '',
      termination_reason: initial.termination_reason ?? '',
      position: initial.position ?? '',
      placement_location: initial.placement_location ?? '',
      branch: initial.branch ?? '',
      employment_contract_type: initial.employment_contract_type ?? '',
      contract_duration_months: initial.contract_duration_months != null ? String(initial.contract_duration_months) : '',
      department_id: initial.department_id != null ? String(initial.department_id) : '',
      client_id: initial.client_id != null ? String(initial.client_id) : '',
    });
  }, [initial]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          employee_number: toNullableString(form.employee_number),
          email: toNullableString(form.email),
          company_email: toNullableString(form.company_email),
          phone: toNullableString(form.phone),
          status: toNullableString(form.status),
          hire_date: toNullableString(form.hire_date),
          join_date: toNullableString(form.join_date),
          termination_type: toNullableString(form.termination_type),
          last_working_date: toNullableString(form.last_working_date),
          termination_reason: toNullableString(form.termination_reason),
          position: toNullableString(form.position),
          placement_location: toNullableString(form.placement_location),
          branch: toNullableString(form.branch),
          employment_contract_type: toNullableString(form.employment_contract_type),
          contract_duration_months: parseNumberOrNull(form.contract_duration_months),
          department_id: parseNumberOrNull(form.department_id),
          client_id: parseNumberOrNull(form.client_id),
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputRow label="NIP / Employee number" value={form.employee_number} onChange={(v) => setForm((s) => ({ ...s, employee_number: v }))} />
        <InputRow label="Email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} />
        <InputRow label="Company Email" value={form.company_email} onChange={(v) => setForm((s) => ({ ...s, company_email: v }))} />
        <InputRow label="Phone Number" value={form.phone} onChange={(v) => setForm((s) => ({ ...s, phone: v }))} />
        <InputRow label="Status" value={form.status} onChange={(v) => setForm((s) => ({ ...s, status: v }))} />
        <InputRow label="Contract Type (pkwt/partnership)" value={form.employment_contract_type} onChange={(v) => setForm((s) => ({ ...s, employment_contract_type: v }))} />
        <InputRow label="Contract duration (months)" value={form.contract_duration_months} onChange={(v) => setForm((s) => ({ ...s, contract_duration_months: v }))} />
        <DateInputRow label="Hire Date" value={form.hire_date} onChange={(v) => setForm((s) => ({ ...s, hire_date: v }))} />
        <DateInputRow label="Join Date" value={form.join_date} onChange={(v) => setForm((s) => ({ ...s, join_date: v }))} />
        <InputRow label="Offboarding Type" value={form.termination_type} onChange={(v) => setForm((s) => ({ ...s, termination_type: v }))} />
        <DateInputRow label="Last Working Date" value={form.last_working_date} onChange={(v) => setForm((s) => ({ ...s, last_working_date: v }))} />
        <InputRow label="Position" value={form.position} onChange={(v) => setForm((s) => ({ ...s, position: v }))} />
        <InputRow label="Placement Location" value={form.placement_location} onChange={(v) => setForm((s) => ({ ...s, placement_location: v }))} />
        <InputRow label="Branch" value={form.branch} onChange={(v) => setForm((s) => ({ ...s, branch: v }))} />
        <InputRow label="Department ID" value={form.department_id} onChange={(v) => setForm((s) => ({ ...s, department_id: v }))} />
        <InputRow label="Client ID" value={form.client_id} onChange={(v) => setForm((s) => ({ ...s, client_id: v }))} />
        <div className="md:col-span-2">
          <InputRow label="Termination Reason" value={form.termination_reason} onChange={(v) => setForm((s) => ({ ...s, termination_reason: v }))} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-70">
          {saving ? 'Saving...' : 'Save Employee Information'}
        </button>
      </div>
    </form>
  );
}

function PersonalInfoForm({ initial, saving, onCancel, onSave }: EditorProps<Employee, api.EmployeePersonalPayload>) {
  const [form, setForm] = useState({
    identification_id: initial.identification_id ?? '',
    id_expired_date: initial.id_expired_date ?? '',
    birthdate: initial.birthdate ?? '',
    place_of_birth: initial.place_of_birth ?? '',
    gender: initial.gender ?? '',
    marital_status: initial.marital_status ?? '',
    child_number: initial.child_number != null ? String(initial.child_number) : '',
    religion: initial.religion ?? '',
  });

  useEffect(() => {
    setForm({
      identification_id: initial.identification_id ?? '',
      id_expired_date: initial.id_expired_date ?? '',
      birthdate: initial.birthdate ?? '',
      place_of_birth: initial.place_of_birth ?? '',
      gender: initial.gender ?? '',
      marital_status: initial.marital_status ?? '',
      child_number: initial.child_number != null ? String(initial.child_number) : '',
      religion: initial.religion ?? '',
    });
  }, [initial]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          identification_id: toNullableString(form.identification_id),
          id_expired_date: toNullableString(form.id_expired_date),
          birthdate: toNullableString(form.birthdate),
          place_of_birth: toNullableString(form.place_of_birth),
          gender: toNullableString(form.gender),
          marital_status: toNullableString(form.marital_status),
          child_number: parseNumberOrNull(form.child_number),
          religion: toNullableString(form.religion),
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputRow label="ID Number (KTP)" value={form.identification_id} onChange={(v) => setForm((s) => ({ ...s, identification_id: v }))} />
        <DateInputRow label="ID Expired Date" value={form.id_expired_date} onChange={(v) => setForm((s) => ({ ...s, id_expired_date: v }))} />
        <DateInputRow label="Date of Birth" value={form.birthdate} onChange={(v) => setForm((s) => ({ ...s, birthdate: v }))} />
        <InputRow label="Place of Birth" value={form.place_of_birth} onChange={(v) => setForm((s) => ({ ...s, place_of_birth: v }))} />
        <InputRow label="Gender (male/female)" value={form.gender} onChange={(v) => setForm((s) => ({ ...s, gender: v }))} />
        <InputRow label="Religion" value={form.religion} onChange={(v) => setForm((s) => ({ ...s, religion: v }))} />
        <InputRow label="Marital Status" value={form.marital_status} onChange={(v) => setForm((s) => ({ ...s, marital_status: v }))} />
        <InputRow label="Number of Children" value={form.child_number} onChange={(v) => setForm((s) => ({ ...s, child_number: v }))} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-70">
          {saving ? 'Saving...' : 'Save Personal Information'}
        </button>
      </div>
    </form>
  );
}

function FinancialInfoForm({ initial, saving, onCancel, onSave }: EditorProps<Employee, api.EmployeeFinancialPayload>) {
  const [form, setForm] = useState({
    tax_status: initial.tax_status ?? '',
    npwp: initial.npwp ?? '',
    salary: initial.salary ?? '',
    annual_leave_nominal: initial.annual_leave_nominal ?? '',
    bank_name: initial.bank_name ?? '',
    bank_account: initial.bank_account ?? '',
    bank_account_holder: initial.bank_account_holder ?? '',
    bank_id: initial.bank_id != null ? String(initial.bank_id) : '',
    bpjstk_id: initial.bpjstk_id ?? '',
    bpjsks_id: initial.bpjsks_id ?? '',
    bpjs_bpu: initial.bpjs_bpu ?? '',
    positional_allowance: initial.positional_allowance ?? '',
    transport_allowance: initial.transport_allowance ?? '',
    comm_allowance: initial.comm_allowance ?? '',
    misc_allowance: initial.misc_allowance ?? '',
    insurance_provider: initial.insurance_provider ?? '',
    insurance_no: initial.insurance_no ?? '',
    overtime_nominal: initial.overtime_nominal ?? '',
  });

  useEffect(() => {
    setForm({
      tax_status: initial.tax_status ?? '',
      npwp: initial.npwp ?? '',
      salary: initial.salary ?? '',
      annual_leave_nominal: initial.annual_leave_nominal ?? '',
      bank_name: initial.bank_name ?? '',
      bank_account: initial.bank_account ?? '',
      bank_account_holder: initial.bank_account_holder ?? '',
      bank_id: initial.bank_id != null ? String(initial.bank_id) : '',
      bpjstk_id: initial.bpjstk_id ?? '',
      bpjsks_id: initial.bpjsks_id ?? '',
      bpjs_bpu: initial.bpjs_bpu ?? '',
      positional_allowance: initial.positional_allowance ?? '',
      transport_allowance: initial.transport_allowance ?? '',
      comm_allowance: initial.comm_allowance ?? '',
      misc_allowance: initial.misc_allowance ?? '',
      insurance_provider: initial.insurance_provider ?? '',
      insurance_no: initial.insurance_no ?? '',
      overtime_nominal: initial.overtime_nominal ?? '',
    });
  }, [initial]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          tax_status: toNullableString(form.tax_status),
          npwp: toNullableString(form.npwp),
          salary: toNullableString(form.salary),
          annual_leave_nominal: toNullableString(form.annual_leave_nominal),
          bank_name: toNullableString(form.bank_name),
          bank_account: toNullableString(form.bank_account),
          bank_account_holder: toNullableString(form.bank_account_holder),
          bank_id: parseNumberOrNull(form.bank_id),
          bpjstk_id: toNullableString(form.bpjstk_id),
          bpjsks_id: toNullableString(form.bpjsks_id),
          bpjs_bpu: toNullableString(form.bpjs_bpu),
          positional_allowance: toNullableString(form.positional_allowance),
          transport_allowance: toNullableString(form.transport_allowance),
          comm_allowance: toNullableString(form.comm_allowance),
          misc_allowance: toNullableString(form.misc_allowance),
          insurance_provider: toNullableString(form.insurance_provider),
          insurance_no: toNullableString(form.insurance_no),
          overtime_nominal: toNullableString(form.overtime_nominal),
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputRow label="Tax Status" value={form.tax_status} onChange={(v) => setForm((s) => ({ ...s, tax_status: v }))} />
        <InputRow label="NPWP Number" value={form.npwp} onChange={(v) => setForm((s) => ({ ...s, npwp: v }))} />
        <InputRow label="Salary" value={form.salary} onChange={(v) => setForm((s) => ({ ...s, salary: v }))} />
        <InputRow label="Annual Leave Nominal" value={form.annual_leave_nominal} onChange={(v) => setForm((s) => ({ ...s, annual_leave_nominal: v }))} />
        <InputRow label="Bank Name" value={form.bank_name} onChange={(v) => setForm((s) => ({ ...s, bank_name: v }))} />
        <InputRow label="Bank Account Number" value={form.bank_account} onChange={(v) => setForm((s) => ({ ...s, bank_account: v }))} />
        <InputRow label="Bank Account Holder" value={form.bank_account_holder} onChange={(v) => setForm((s) => ({ ...s, bank_account_holder: v }))} />
        <InputRow label="Bank ID" value={form.bank_id} onChange={(v) => setForm((s) => ({ ...s, bank_id: v }))} />
        <InputRow label="BPJS Tenaga Kerja ID" value={form.bpjstk_id} onChange={(v) => setForm((s) => ({ ...s, bpjstk_id: v }))} />
        <InputRow label="BPJS Kesehatan ID" value={form.bpjsks_id} onChange={(v) => setForm((s) => ({ ...s, bpjsks_id: v }))} />
        <InputRow label="BPJS BPU ID" value={form.bpjs_bpu} onChange={(v) => setForm((s) => ({ ...s, bpjs_bpu: v }))} />
        <InputRow label="Tunjangan Jabatan" value={form.positional_allowance} onChange={(v) => setForm((s) => ({ ...s, positional_allowance: v }))} />
        <InputRow label="Tunjangan Transportasi" value={form.transport_allowance} onChange={(v) => setForm((s) => ({ ...s, transport_allowance: v }))} />
        <InputRow label="Tunjangan Komunikasi" value={form.comm_allowance} onChange={(v) => setForm((s) => ({ ...s, comm_allowance: v }))} />
        <InputRow label="Tunjangan Lain-lain" value={form.misc_allowance} onChange={(v) => setForm((s) => ({ ...s, misc_allowance: v }))} />
        <InputRow label="Insurance Provider" value={form.insurance_provider} onChange={(v) => setForm((s) => ({ ...s, insurance_provider: v }))} />
        <InputRow label="Insurance No." value={form.insurance_no} onChange={(v) => setForm((s) => ({ ...s, insurance_no: v }))} />
        <InputRow label="Overtime Nominal" value={form.overtime_nominal} onChange={(v) => setForm((s) => ({ ...s, overtime_nominal: v }))} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-70">
          {saving ? 'Saving...' : 'Save Financial Information'}
        </button>
      </div>
    </form>
  );
}

function EmergencyContactForm({ initial, saving, onCancel, onSave }: EditorProps<Employee, api.EmployeeEmergencyPayload>) {
  const [form, setForm] = useState({
    emergency_contact: initial.emergency_contact ?? '',
    emergency_contact_relationship: initial.emergency_contact_relationship ?? '',
    emergency_phone: initial.emergency_phone ?? '',
  });

  useEffect(() => {
    setForm({
      emergency_contact: initial.emergency_contact ?? '',
      emergency_contact_relationship: initial.emergency_contact_relationship ?? '',
      emergency_phone: initial.emergency_phone ?? '',
    });
  }, [initial]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          emergency_contact: toNullableString(form.emergency_contact),
          emergency_contact_relationship: toNullableString(form.emergency_contact_relationship),
          emergency_phone: toNullableString(form.emergency_phone),
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputRow label="Contact Name" value={form.emergency_contact} onChange={(v) => setForm((s) => ({ ...s, emergency_contact: v }))} />
        <InputRow label="Relationship" value={form.emergency_contact_relationship} onChange={(v) => setForm((s) => ({ ...s, emergency_contact_relationship: v }))} />
        <InputRow label="Contact Phone" value={form.emergency_phone} onChange={(v) => setForm((s) => ({ ...s, emergency_phone: v }))} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-70">
          {saving ? 'Saving...' : 'Save Emergency Contact'}
        </button>
      </div>
    </form>
  );
}

function AddressInfoForm({ initial, saving, onCancel, onSave }: EditorProps<Employee, api.EmployeeAddressPayload>) {
  const [form, setForm] = useState({
    address: initial.address ?? '',
    rt_rw: initial.rt_rw ?? '',
    village: initial.village ?? '',
    sub_district: initial.sub_district ?? '',
    district: initial.district ?? '',
    province: initial.province ?? '',
    zip_code: initial.zip_code ?? '',
    domicile_address: initial.domicile_address ?? '',
    domicile_rt_rw: initial.domicile_rt_rw ?? '',
    domicile_province: initial.domicile_province ?? '',
    domicile_district: initial.domicile_district ?? '',
    domicile_sub_district: initial.domicile_sub_district ?? '',
    domicile_zip_code: initial.domicile_zip_code ?? '',
  });

  useEffect(() => {
    setForm({
      address: initial.address ?? '',
      rt_rw: initial.rt_rw ?? '',
      village: initial.village ?? '',
      sub_district: initial.sub_district ?? '',
      district: initial.district ?? '',
      province: initial.province ?? '',
      zip_code: initial.zip_code ?? '',
      domicile_address: initial.domicile_address ?? '',
      domicile_rt_rw: initial.domicile_rt_rw ?? '',
      domicile_province: initial.domicile_province ?? '',
      domicile_district: initial.domicile_district ?? '',
      domicile_sub_district: initial.domicile_sub_district ?? '',
      domicile_zip_code: initial.domicile_zip_code ?? '',
    });
  }, [initial]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          address: toNullableString(form.address),
          rt_rw: toNullableString(form.rt_rw),
          village: toNullableString(form.village),
          sub_district: toNullableString(form.sub_district),
          district: toNullableString(form.district),
          province: toNullableString(form.province),
          zip_code: toNullableString(form.zip_code),
          domicile_address: toNullableString(form.domicile_address),
          domicile_rt_rw: toNullableString(form.domicile_rt_rw),
          domicile_province: toNullableString(form.domicile_province),
          domicile_district: toNullableString(form.domicile_district),
          domicile_sub_district: toNullableString(form.domicile_sub_district),
          domicile_zip_code: toNullableString(form.domicile_zip_code),
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <InputRow label="Address (Street)" value={form.address} onChange={(v) => setForm((s) => ({ ...s, address: v }))} />
        </div>
        <InputRow label="RT/RW" value={form.rt_rw} onChange={(v) => setForm((s) => ({ ...s, rt_rw: v }))} />
        <InputRow label="Kelurahan / Village" value={form.village} onChange={(v) => setForm((s) => ({ ...s, village: v }))} />
        <InputRow label="Province" value={form.province} onChange={(v) => setForm((s) => ({ ...s, province: v }))} />
        <InputRow label="Kabupaten / Kota" value={form.district} onChange={(v) => setForm((s) => ({ ...s, district: v }))} />
        <InputRow label="Kecamatan / Sub-District" value={form.sub_district} onChange={(v) => setForm((s) => ({ ...s, sub_district: v }))} />
        <InputRow label="Zip Code" value={form.zip_code} onChange={(v) => setForm((s) => ({ ...s, zip_code: v }))} />
        <div className="md:col-span-2">
          <InputRow label="Domicile Address (Street)" value={form.domicile_address} onChange={(v) => setForm((s) => ({ ...s, domicile_address: v }))} />
        </div>
        <InputRow label="Domicile RT/RW" value={form.domicile_rt_rw} onChange={(v) => setForm((s) => ({ ...s, domicile_rt_rw: v }))} />
        <InputRow label="Domicile Province" value={form.domicile_province} onChange={(v) => setForm((s) => ({ ...s, domicile_province: v }))} />
        <InputRow label="Domicile Kabupaten / Kota" value={form.domicile_district} onChange={(v) => setForm((s) => ({ ...s, domicile_district: v }))} />
        <InputRow label="Domicile Kecamatan / Sub-District" value={form.domicile_sub_district} onChange={(v) => setForm((s) => ({ ...s, domicile_sub_district: v }))} />
        <InputRow label="Domicile Zip Code" value={form.domicile_zip_code} onChange={(v) => setForm((s) => ({ ...s, domicile_zip_code: v }))} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-70">
          {saving ? 'Saving...' : 'Save Address Information'}
        </button>
      </div>
    </form>
  );
}

function EducationForm({ initial, saving, onCancel, onSave }: EditorProps<EmployeeEducation>) {
  const [form, setForm] = useState<EmployeeEducation>(initial ?? {});

  useEffect(() => {
    setForm(initial ?? {});
  }, [initial]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          last_education: cleanString(form.last_education),
          major: cleanString(form.major),
          graduation_year: cleanString(form.graduation_year),
          school_name: cleanString(form.school_name),
          gpa: cleanString(form.gpa),
          city: cleanString(form.city),
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputRow label="Pendidikan terakhir" value={form.last_education} onChange={(v) => setForm((s) => ({ ...s, last_education: v }))} />
        <InputRow label="Jurusan" value={form.major} onChange={(v) => setForm((s) => ({ ...s, major: v }))} />
        <InputRow label="Tahun Lulus" value={form.graduation_year} onChange={(v) => setForm((s) => ({ ...s, graduation_year: v }))} />
        <InputRow label="Nama Sekolah" value={form.school_name} onChange={(v) => setForm((s) => ({ ...s, school_name: v }))} />
        <InputRow label="IPK / Nilai" value={form.gpa} onChange={(v) => setForm((s) => ({ ...s, gpa: v }))} />
        <InputRow label="Kota" value={form.city} onChange={(v) => setForm((s) => ({ ...s, city: v }))} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save Education'}
        </button>
      </div>
    </form>
  );
}

function FamilyForm({ initial, saving, onCancel, onSave }: EditorProps<EmployeeFamily>) {
  const [form, setForm] = useState<EmployeeFamily>(initial ?? {});

  useEffect(() => {
    setForm(initial ?? {});
  }, [initial]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          family_card_number: cleanString(form.family_card_number),
          father_name: cleanString(form.father_name),
          mother_name: cleanString(form.mother_name),
          wife_name: cleanString(form.wife_name),
          child1_name: cleanString(form.child1_name),
          child2_name: cleanString(form.child2_name),
          child3_name: cleanString(form.child3_name),
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputRow label="Nomor Kartu Keluarga" value={form.family_card_number} onChange={(v) => setForm((s) => ({ ...s, family_card_number: v }))} />
        <InputRow label="Nama Ayah" value={form.father_name} onChange={(v) => setForm((s) => ({ ...s, father_name: v }))} />
        <InputRow label="Nama Ibu" value={form.mother_name} onChange={(v) => setForm((s) => ({ ...s, mother_name: v }))} />
        <InputRow label="Nama Istri" value={form.wife_name} onChange={(v) => setForm((s) => ({ ...s, wife_name: v }))} />
        <InputRow label="Nama Anak 1" value={form.child1_name} onChange={(v) => setForm((s) => ({ ...s, child1_name: v }))} />
        <InputRow label="Nama Anak 2" value={form.child2_name} onChange={(v) => setForm((s) => ({ ...s, child2_name: v }))} />
        <InputRow label="Nama Anak 3" value={form.child3_name} onChange={(v) => setForm((s) => ({ ...s, child3_name: v }))} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save Family'}
        </button>
      </div>
    </form>
  );
}
