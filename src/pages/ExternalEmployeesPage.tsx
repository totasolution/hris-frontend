import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { ButtonLink } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Select as NativeSelect } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Employee } from '../services/api';
import * as api from '../services/api';

const clientSelectStyles = {
  control: (base: object) => ({
    ...base,
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    padding: '2px',
    boxShadow: 'none',
    minWidth: 200,
    '&:hover': { border: '1px solid #107BC7' },
  }),
  option: (base: object, state: { isSelected?: boolean; isFocused?: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? '#107BC7' : state.isFocused ? '#E8F5FF' : 'white',
    color: state.isSelected ? 'white' : '#282828',
    fontSize: '0.875rem',
    fontWeight: '500',
  }),
  placeholder: (base: object) => ({
    ...base,
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontWeight: '500',
  }),
  singleValue: (base: object) => ({
    ...base,
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#282828',
  }),
};

export default function ExternalEmployeesPage() {
  const { t } = useTranslation('pages');
  const { permissions = [] } = useAuth();
  const canCreate = permissions.includes('employee_external:create');
  const canUpdate = permissions.includes('employee_external:update');
  // Filters & pagination live in the URL so navigating to an employee and back
  // (browser back / the detail page's Back button) restores the exact same view.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const statusFilter = searchParams.get('status') || '';
  const clientId = searchParams.get('client_id') || '';
  const search = searchParams.get('q') || '';
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<api.Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;

  const updateParams = (changes: Record<string, string>, resetPage = false) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (resetPage) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };
  const setStatusFilter = (value: string) => updateParams({ status: value }, true);
  const setClientId = (value: string) => updateParams({ client_id: value }, true);
  const setSearch = (value: string) => updateParams({ q: value }, true);
  const setPage = (value: number) => updateParams({ page: value > 1 ? String(value) : '' });
  const [downloading, setDownloading] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<api.EmployeeTemplateUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getClients().then(setClients).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEmployees({
        employee_type: 'external',
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        client_id: clientId ? Number(clientId) : undefined,
        page,
        per_page: perPage,
      });
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('employees.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, clientId, search, page]);

  const handleDownload = async () => {
    if (!clientId) return;
    setDownloading(true);
    setError(null);
    try {
      await api.downloadEmployees(Number(clientId));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('employees.downloadEmployeesError'));
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!clientId) return;
    setTemplateDownloading(true);
    setError(null);
    try {
      await api.downloadEmployeeTemplate(Number(clientId));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('employees.downloadTemplateError'));
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const result = await api.uploadEmployeeTemplate(file);
      setImportResult(result);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('employees.importTemplateError'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('employees.externalTitle')}
        subtitle={t('employees.externalSubtitle')}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!clientId || downloading}
              title={!clientId ? t('employees.downloadEmployeesHint') : t('employees.downloadEmployees')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {t('employees.downloadEmployees')}
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={!clientId || templateDownloading}
              title={!clientId ? t('employees.downloadTemplateHint') : t('employees.downloadTemplate')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {templateDownloading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {t('employees.downloadTemplate')}
            </button>
            {canUpdate && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                  {t('employees.importTemplate')}
                </button>
              </>
            )}
            {canCreate && (
              <ButtonLink to="/employees/external/new">{t('employees.addEmployee')}</ButtonLink>
            )}
          </div>
        }
      />

      {importResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-800">{t('employees.importResultTitle')}</span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                {t('employees.importUpdated', { count: importResult.updated })}
              </span>
              {importResult.skipped > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
                  {t('employees.importSkipped', { count: importResult.skipped })}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setImportResult(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              {t('employees.importDismiss')}
            </button>
          </div>
          {importResult.rows.some((r) => r.status === 'error') && (
            <ul className="space-y-1 max-h-48 overflow-auto">
              {importResult.rows
                .filter((r) => r.status === 'error')
                .map((r) => (
                  <li key={r.row} className="text-xs text-red-600">
                    Row {r.row}{r.employee_id ? ` (ID ${r.employee_id})` : ''}: {r.message}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <input
            type="text"
            placeholder={t('employees.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <div className="w-64">
          <NativeSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('employees.allStatuses')}</option>
            <option value="active">{t('employees.statusActive')}</option>
            <option value="terminated">{t('employees.statusTerminated')}</option>
            <option value="resigned">{t('employees.statusResigned')}</option>
            <option value="contract_ended">{t('employees.statusContractEnded')}</option>
          </NativeSelect>
        </div>
        <div className="w-64">
          <Select
            options={[
              { value: '', label: t('employees.allClients') },
              ...clients.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            value={clientId ? { value: clientId, label: clients.find((c) => String(c.id) === clientId)?.name ?? clientId } : { value: '', label: t('employees.allClients') }}
            onChange={(option: { value: string; label: string } | null) => setClientId(option?.value ?? '')}
            placeholder={t('employees.allClients')}
            styles={clientSelectStyles}
            isSearchable
            isClearable
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('employees.fullName')}</TH>
                <TH>{t('employees.client')}</TH>
                <TH>PIC</TH>
                <TH>{t('employees.employeeNumber')}</TH>
                <TH>{t('employees.emailAddress')}</TH>
                <TH>{t('common:status')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="py-12 text-center text-slate-400">
                    {t('employees.noEmployeesFound')}
                  </TD>
                </TR>
              ) : (
                list.map((e) => (
                  <TR key={e.id}>
                    <TD className="font-bold text-[#0f172a]">
                      <Link to={`/employees/${e.id}`} className="hover:text-brand transition-colors">
                        {e.full_name}
                      </Link>
                    </TD>
                    <TD className="text-slate-600">{e.client_name || '—'}</TD>
                    <TD className="text-slate-600">{e.pic_name || '—'}</TD>
                    <TD className="text-slate-600">{e.employee_number ?? '—'}</TD>
                    <TD>{e.email}</TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {e.status.replace('_', ' ')}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/employees/${e.id}`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors inline-block"
                          title={t('employees.viewEmployee')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  );
}
