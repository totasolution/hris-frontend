import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/Card';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const toast = useToast();

  const handlePreview = async (p: Payslip) => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewUrl(null);
    setPreviewTitle(p.period_label ? `Payslip ${p.period_label}` : `Payslip #${p.id}`);
    try {
      const url = await api.getPayslipPresignedUrl(p.id);
      setPreviewUrl(url);
    } catch {
      toast.error(t('pages:payslips.failedToOpenPayslip'));
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

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

  const handleDeletePeriod = async () => {
    const parsedYear = parseInt(year, 10);
    const parsedMonth = month ? parseInt(month, 10) : NaN;
    if (!parsedYear || Number.isNaN(parsedMonth)) {
      toast.error(t('pages:payslips.deletePeriodMissing', 'Please select a valid year and month.'));
      return;
    }
    const label = `${MONTHS.find((m) => m.value === month)?.label ?? month}/${parsedYear}`;
    const confirmed = window.confirm(
      t(
        'pages:payslips.confirmDeletePeriod',
        'Delete all payslips for period {{period}}? This action cannot be undone.',
        { period: label }
      )
    );
    if (!confirmed) return;

    try {
      const result = await api.deletePayslipsByPeriod(parsedYear, parsedMonth);
      if (result.deleted === 0) {
        toast.warning(
          t(
            'pages:payslips.deletePeriodNoRows',
            'No payslips found for the selected period.'
          )
        );
      } else {
        toast.success(
          t(
            'pages:payslips.deletePeriodSuccess',
            '{{count}} payslips deleted for {{period}}.',
            { count: result.deleted, period: label }
          )
        );
      }
      await load();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : t('pages:payslips.deletePeriodFailed', 'Failed to delete payslips for this period.')
      );
    }
  };

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

      {/* Filters + period actions */}
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
        <div className="ml-auto">
          <button
            type="button"
            onClick={handleDeletePeriod}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-xs font-semibold uppercase tracking-wide text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!month}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
            </svg>
            {t('pages:payslips.deletePeriodButton', 'Delete payslips for period')}
          </button>
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
                <TH>{t('pages:payslips.identificationId')}</TH>
                <TH>{t('pages:payslips.nip')}</TH>
                <TH>{t('pages:payslips.clientName')}</TH>
                <TH>{t('pages:payslips.period')}</TH>
                <TH>{t('pages:payslips.created')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredList.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="py-12 text-center text-slate-400">
                    {t('pages:payslips.noPayslipsFound')}
                  </TD>
                </TR>
              ) : (
                paginatedList.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-medium text-brand-dark">
                      {p.employee_name ?? `Employee #${p.employee_id}`}
                    </TD>
                    <TD className="text-sm text-slate-600">{p.identification_id ?? '—'}</TD>
                    <TD className="text-sm text-slate-600">{p.employee_number ?? '—'}</TD>
                    <TD className="text-sm text-slate-600">{p.client_name ?? '—'}</TD>
                    <TD>{p.period_label}</TD>
                    <TD className="text-sm text-slate-500">
                      {formatDate(p.created_at)}
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-0">
                        <button
                          type="button"
                          onClick={() => handlePreview(p)}
                          className="p-2 text-slate-400 hover:text-brand transition-colors"
                          title={t('common:preview')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
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
                      </div>
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

      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewTitle}
        src={previewUrl}
        isLoading={previewLoading}
      />
    </div>
  );
}
