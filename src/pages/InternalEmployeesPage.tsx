import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Select as NativeSelect } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Employee } from '../services/api';
import * as api from '../services/api';

export default function InternalEmployeesPage() {
  const { t } = useTranslation('pages');
  const { permissions = [] } = useAuth();
  const canCreate = permissions.includes('employee_internal:create');
  // Filters & pagination live in the URL so navigating to an employee and back
  // (browser back / the detail page's Back button) restores the exact same view.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const statusFilter = searchParams.get('status') || '';
  const search = searchParams.get('q') || '';
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const setSearch = (value: string) => updateParams({ q: value }, true);
  const setPage = (value: number) => updateParams({ page: value > 1 ? String(value) : '' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEmployees({
        employee_type: 'internal',
        status: statusFilter || undefined,
        search: search.trim() || undefined,
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
  }, [statusFilter, search, page]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('employees.internalTitle')}
        subtitle={t('employees.internalSubtitle')}
        actions={canCreate ? <ButtonLink to="/employees/internal/new">{t('employees.addEmployee')}</ButtonLink> : undefined}
      />

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
                  <TD colSpan={6} className="py-12 text-center text-slate-400">
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
