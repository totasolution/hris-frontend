import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useToast } from '../components/Toast';
import type { Employee, Payslip } from '../services/api';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';

const MONTHS = [
  { value: '', label: 'All months' },
  { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
  { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

type BulkRow = { file: File | null; employee_id: string; year: string; month: string };

export default function PayslipsPage() {
  const [list, setList] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [year, setYear] = useState<string>(String(currentYear));
  const [month, setMonth] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { permissions = [] } = useAuth();
  const canUpload = permissions.includes('payslip:create');
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPayslips({
        employee_id: employeeId ? parseInt(employeeId, 10) : undefined,
        year: year ? parseInt(year, 10) : undefined,
        month: month ? parseInt(month, 10) : undefined,
      });
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  }, [employeeId, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.getEmployees({ per_page: 1000, status: 'active' }).then((r) => setEmployees(r.data)).catch(() => {});
  }, []);

  const handleDownload = async (p: Payslip) => {
    try {
      const url = await api.getPayslipPresignedUrl(p.id);
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to open payslip');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payslips"
        subtitle="Payslip per employee per month"
      />

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-56">
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={String(e.id)}>{e.full_name}</option>
            ))}
          </Select>
        </div>
        <div className="w-32">
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((m) => (
              <option key={m.value || 'all'} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Bulk upload (for users with payslip:create) */}
      {canUpload && (
        <BulkUploadSection
          employees={employees}
          onSuccess={() => { load(); toast.success('Payslips uploaded'); }}
          toast={toast}
        />
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Employee</TH>
                <TH>Period</TH>
                <TH>Created</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    No payslips found.
                  </TD>
                </TR>
              ) : (
                list.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-medium text-brand-dark">
                      {p.employee_name ?? `Employee #${p.employee_id}`}
                    </TD>
                    <TD>{p.period_label}</TD>
                    <TD className="text-sm text-slate-500">
                      {formatDate(p.created_at)}
                    </TD>
                    <TD className="text-right">
                      <button
                        type="button"
                        onClick={() => handleDownload(p)}
                        className="p-2 text-slate-400 hover:text-brand transition-colors"
                        title="Download"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function BulkUploadSection({
  employees,
  onSuccess,
  toast,
}: {
  employees: Employee[];
  onSuccess: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [rows, setRows] = useState<BulkRow[]>([
    { file: null, employee_id: '', year: String(currentYear), month: '1' },
  ]);
  const [uploading, setUploading] = useState(false);

  const addRow = () => {
    setRows((r) => [...r, { file: null, employee_id: '', year: String(currentYear), month: '1' }]);
  };

  const removeRow = (index: number) => {
    setRows((r) => r.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof BulkRow, value: string | File | null) => {
    setRows((r) => {
      const next = [...r];
      if (field === 'file') next[index] = { ...next[index], file: value as File | null };
      else next[index] = { ...next[index], [field]: value as string };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entries: api.BulkUploadPayslipEntry[] = [];
    const files: File[] = [];
    for (const row of rows) {
      if (!row.file || !row.employee_id || !row.year || !row.month) continue;
      const empId = parseInt(row.employee_id, 10);
      const y = parseInt(row.year, 10);
      const m = parseInt(row.month, 10);
      if (isNaN(empId) || isNaN(y) || m < 1 || m > 12) continue;
      entries.push({ employee_id: empId, year: y, month: m });
      files.push(row.file);
    }
    if (entries.length === 0) {
      toast.error('Add at least one row with file, employee, and period');
      return;
    }
    setUploading(true);
    try {
      const res = await api.bulkUploadPayslips(entries, files);
      if (res.failed?.length) {
        toast.error(`${res.count} uploaded; ${res.failed.length} failed: ${res.failed.join(', ')}`);
      } else {
        toast.success(`${res.count} payslip(s) uploaded`);
      }
      onSuccess();
      setRows([{ file: null, employee_id: '', year: String(currentYear), month: '1' }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline mb-4">
          Bulk upload payslips
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-bold text-slate-500">File</th>
                  <th className="text-left py-2 font-bold text-slate-500">Employee</th>
                  <th className="text-left py-2 font-bold text-slate-500">Year</th>
                  <th className="text-left py-2 font-bold text-slate-500">Month</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateRow(i, 'file', e.target.files?.[0] ?? null)}
                        className="text-slate-600 max-w-[200px] truncate block"
                      />
                    </td>
                    <td className="py-2">
                      <Select
                        value={row.employee_id}
                        onChange={(e) => updateRow(i, 'employee_id', e.target.value)}
                      >
                        <option value="">Select employee</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={String(emp.id)}>{emp.full_name}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="py-2">
                      <Select value={row.year} onChange={(e) => updateRow(i, 'year', e.target.value)}>
                        {YEARS.map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="py-2">
                      <Select value={row.month} onChange={(e) => updateRow(i, 'month', e.target.value)}>
                        {MONTHS.filter((m) => m.value).map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="text-slate-400 hover:text-red-500 text-sm"
                        disabled={rows.length <= 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={addRow} className="text-sm font-bold text-brand hover:underline">
              + Add row
            </button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload payslips'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
