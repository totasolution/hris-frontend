import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import type { Payslip } from '../services/api';
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

export default function PayslipsPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [list, setList] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>(String(currentYear));
  const [month, setMonth] = useState<string>('');
  const [employeeNameSearch, setEmployeeNameSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const { permissions = [] } = useAuth();
  const canUpload = permissions.includes('payslip:create');
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPayslips({
        year: year ? parseInt(year, 10) : undefined,
        month: month ? parseInt(month, 10) : undefined,
      });
      setList(data);
      setPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:payslips.loadError'));
    } finally {
      setLoading(false);
    }
  }, [year, month, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async (p: Payslip) => {
    try {
      await api.downloadPayslipDocument(p.id, `payslip-${p.period_label || p.id}.pdf`);
    } catch {
      toast.error(t('pages:payslips.failedToOpenPayslip'));
    }
  };

  const searchTrimmed = employeeNameSearch.trim().toLowerCase();
  const filteredList = searchTrimmed
    ? list.filter((p) => {
        const name = (p.employee_name ?? `Employee #${p.employee_id}`).toLowerCase();
        return name.includes(searchTrimmed);
      })
    : list;
  const total = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startIndex = (page - 1) * perPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + perPage);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:payslips.title')}
        subtitle={t('pages:payslips.subtitle')}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Bulk upload (for users with payslip:create) */}
      {canUpload && (
        <BulkUploadCSVSection
          onSuccess={() => { load(); toast.success(t('pages:payslips.payslipsUploaded')); }}
          toast={toast}
        />
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <input
          type="text"
          value={employeeNameSearch}
          onChange={(e) => {
            setEmployeeNameSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t('pages:payslips.searchByEmployeeName')}
          className="flex-1 min-w-[200px] max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
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
              <option key={m.value || 'all'} value={m.value}>{m.value === '' ? t('pages:payslips.allMonths') : m.label}</option>
            ))}
          </Select>
        </div>
      </div>

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
                <TH>{t('pages:payslips.employee')}</TH>
                <TH>{t('pages:payslips.period')}</TH>
                <TH>{t('pages:payslips.created')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredList.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    {t('pages:payslips.noPayslipsFound')}
                  </TD>
                </TR>
              ) : (
                paginatedList.map((p) => (
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
                        title={t('pages:payslips.download')}
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
          {total > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              perPage={perPage}
              onPageChange={setPage}
            />
          )}
        </Card>
      )}
    </div>
  );
}

function BulkUploadCSVSection({
  onSuccess,
  toast,
}: {
  onSuccess: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const { t } = useTranslation(['pages', 'common']);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error(t('pages:payslips.addRowError'));
      return;
    }
    setUploading(true);
    try {
      const res = await api.bulkUploadPayslipsFromCSV(file);
      if (res.failed?.length) {
        toast.error(`${res.count} generated; ${res.failed.length} failed: ${res.failed.join(', ')}`);
      } else {
        toast.success(t('pages:payslips.payslipsUploaded'));
      }
      onSuccess();
      setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pages:payslips.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <div className="p-6 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
          {t('pages:payslips.bulkUploadCSVTitle', 'Upload payslips from CSV')}
        </h3>
        <p className="text-xs text-slate-500">
          {t(
            'pages:payslips.bulkUploadCSVHelp',
            'Upload a .csv file with columns: nik, year, month, city, print_date (YYYY-MM-DD), prepared_by, gaji, tunjangan_transportasi, insentif, lembur_luar_kota, rapel_salary, refund, kompensasi, bpjs_naker, bpjs_pensiun, bpjs_kesehatan, pph21, admin_bank, denda, rapel_potongan_bpjs, bpjs_ketenagakerjaan_id, bpjs_kesehatan_id.'
          )}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
            className="text-slate-600 max-w-xs text-sm"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              try {
                const blob = await api.downloadPayslipCSVTemplate();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'payslip_template.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : t('pages:payslips.uploadFailed'));
              }
            }}
          >
            {t('pages:payslips.downloadTemplate', 'Download template')}
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? t('pages:payslips.uploading') : t('pages:payslips.uploadPayslips')}
          </Button>
        </form>
      </div>
    </Card>
  );
}
