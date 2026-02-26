import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function EmployeesPage() {
  const { t } = useTranslation('pages');
  const { permissions = [] } = useAuth();
  const canEditEmployee = permissions.includes('employee:update');
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [clients, setClients] = useState<api.Client[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  useEffect(() => {
    api.getClients().then(setClients).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEmployees({
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

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('employees.title')}
        subtitle={t('employees.subtitle')}
        actions={
          permissions.includes('employee:create') ? (
            <ButtonLink to="/employees/new">{t('employees.addEmployee')}</ButtonLink>
          ) : undefined
        }
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <input
            type="text"
            placeholder={t('employees.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <div className="w-64">
          <NativeSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
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
            onChange={(option: { value: string; label: string } | null) => {
              setClientId(option?.value ?? '');
              setPage(1);
            }}
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
                <TH>{t('employees.employeeNumber')}</TH>
                <TH>{t('employees.emailAddress')}</TH>
                <TH>{t('common:status')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="py-12 text-center text-slate-400">
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
                        {canEditEmployee && (
                          <Link
                            to={`/employees/${e.id}/edit`}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors inline-block"
                            title={t('employees.editEmployee')}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                        )}
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
