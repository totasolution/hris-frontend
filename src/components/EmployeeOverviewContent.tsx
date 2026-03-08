import type { Employee, Department, Client } from '../services/api';
import { Card, CardBody, CardHeader } from './Card';
import { formatDate } from '../utils/formatDate';
import { formatGender } from '../utils/formatGender';

export function EmployeeOverviewContent({
  employee,
  departments = [],
  clients = [],
}: {
  employee: Employee;
  departments?: Department[];
  clients?: Client[];
}) {
  const displayDate = employee.join_date || employee.hire_date;

  const contractTypeLabel =
    employee.employment_contract_type === 'pkwt'
      ? 'PKWT'
      : employee.employment_contract_type === 'partnership'
        ? 'Mitra Kerja'
        : employee.employment_contract_type ?? '—';

  return (
    <div className="space-y-8">
      {/* Employee Information */}
      <Card>
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Employee Information
          </h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <Field label="Employee Number" value={employee.employee_number} />
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
        </CardBody>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Personal Information
          </h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </CardBody>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Financial Information
          </h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Tax Status" value={employee.tax_status} />
          <Field label="NPWP Number" value={employee.npwp} />
          <Field label="Salary" value={employee.salary} />
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
        </CardBody>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Emergency Contact
          </h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Contact Name" value={employee.emergency_contact} />
          <Field label="Contact Phone" value={employee.emergency_phone} />
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
  children?: React.ReactNode;
  block?: boolean;
}) {
  const display: React.ReactNode = children ?? (value !== undefined && value !== null && String(value).trim() !== '' ? value : '—');
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
