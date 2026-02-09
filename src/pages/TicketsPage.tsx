import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Select } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Ticket } from '../services/api';
import * as api from '../services/api';

export default function TicketsPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [list, setList] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [departments, setDepartments] = useState<api.Department[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string; department_id?: number; search?: string; page?: number; per_page?: number } = {};
      if (statusFilter) params.status = statusFilter;
      if (departmentId) params.department_id = parseInt(departmentId, 10);
      if (search.trim()) params.search = search.trim();
      params.page = page;
      params.per_page = perPage;
      const res = await api.getTickets(params);
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:tickets.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, departmentId, search, page]);

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:tickets.title')}
        subtitle={t('pages:tickets.subtitle')}
        actions={<ButtonLink to="/tickets/new">{t('pages:tickets.newTicket')}</ButtonLink>}
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <input
            type="text"
            placeholder={t('pages:tickets.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <div className="w-64">
          <Select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">{t('pages:tickets.allDepartments')}</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </Select>
        </div>
        <div className="w-64">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('pages:tickets.allStatuses')}</option>
            <option value="open">{t('pages:tickets.statusOpen')}</option>
            <option value="in_progress">{t('pages:tickets.statusInProgress')}</option>
            <option value="resolved">{t('pages:tickets.statusResolved')}</option>
            <option value="closed">{t('pages:tickets.statusClosed')}</option>
          </Select>
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
                <TH>{t('pages:tickets.subject')}</TH>
                <TH>{t('pages:tickets.status')}</TH>
                <TH>{t('pages:tickets.department')}</TH>
                <TH>{t('pages:tickets.assignee')}</TH>
                <TH>{t('pages:tickets.createdAt')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="py-12 text-center text-slate-400">
                    {t('pages:tickets.noTicketsFound')}
                  </TD>
                </TR>
              ) : (
                list.map((t) => (
                  <TR key={t.id}>
                    <TD className="font-bold text-[#0f172a]">{t.subject}</TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        t.status === 'open' ? 'bg-blue-100 text-blue-700' :
                        t.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </TD>
                    <TD>{departments.find(d => d.id === t.department_id)?.name ?? `ID: ${t.department_id}`}</TD>
                    <TD className="text-sm text-slate-600">{t.assignee_name ?? (t.assignee_id ? 'Assigned' : '—')}</TD>
                    <TD>{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</TD>
                    <TD className="text-right">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="p-2 text-slate-400 hover:text-brand transition-colors inline-block"
                        title={t('pages:tickets.viewTicket')}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
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
