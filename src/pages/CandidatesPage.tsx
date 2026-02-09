import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Candidate, Client } from '../services/api';
import * as api from '../services/api';

const customSelectStyles = {
  control: (base: any) => ({
    ...base,
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    padding: '2px',
    boxShadow: 'none',
    '&:hover': {
      border: '1px solid #107BC7',
    },
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#107BC7' : state.isFocused ? '#E8F5FF' : 'white',
    color: state.isSelected ? 'white' : '#282828',
    fontSize: '0.875rem',
    fontWeight: '500',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontWeight: '500',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#282828',
  }),
};

export default function CandidatesPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [searchParams] = useSearchParams();
  const [list, setList] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(() => searchParams.get('status') ?? '');
  const [clientId, setClientId] = useState<string>(() => searchParams.get('client_id') ?? '');
  const [projectId, setProjectId] = useState<string>(() => searchParams.get('project_id') ?? '');
  const [createdById] = useState<string>(() => searchParams.get('created_by') ?? '');
  const [searchName, setSearchName] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<api.Project[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string; client_id?: number; project_id?: number; created_by?: number; search?: string; page?: number; per_page?: number } = {};
      if (statusFilter) params.status = statusFilter;
      if (clientId) params.client_id = parseInt(clientId, 10);
      if (projectId) params.project_id = parseInt(projectId, 10);
      if (createdById) params.created_by = parseInt(createdById, 10);
      if (searchName.trim()) params.search = searchName.trim();
      params.page = page;
      params.per_page = perPage;
      const res = await api.getCandidates(params);
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:candidates.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, clientId, projectId, createdById, searchName, page]);

  useEffect(() => {
    Promise.all([api.getClients(), api.getProjects()]).then(([cList, pList]) => {
      setClients(cList);
      setProjects(pList);
    }).catch(() => {});
  }, []);

  const filteredProjects = projects.filter(p => !clientId || String(p.client_id) === clientId);

  const clientOptions = clients.map(c => ({ value: String(c.id), label: c.name }));
  const projectOptions = filteredProjects.map(p => ({ value: String(p.id), label: p.name }));
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'screening', label: 'Screening' },
    { value: 'screened_pass', label: 'Screened Pass' },
    { value: 'screened_fail', label: 'Screened Fail' },
    { value: 'submitted', label: 'Submitted to Client' },
    { value: 'interview_scheduled', label: 'Interviewing' },
    { value: 'interview_passed', label: 'Interview Passed' },
    { value: 'interview_failed', label: 'Interview Failed' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'onboarding_completed', label: 'Onboarding Done (form submitted)' },
    { value: 'contract_requested', label: 'Contract Requested' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-8 font-body">
      <PageHeader
        title={t('pages:candidates.title')}
        subtitle={t('pages:candidates.subtitle')}
        actions={<ButtonLink to="/candidates/new">{t('pages:candidates.addCandidate')}</ButtonLink>}
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <input
            type="text"
            placeholder={t('pages:candidates.searchPlaceholder')}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <div className="w-64">
          <Select
            options={clientOptions}
            value={clientOptions.find(o => o.value === clientId)}
            onChange={(option: any) => {
              setClientId(option?.value || '');
              setProjectId('');
            }}
            placeholder={t('pages:candidates.allClients')}
            styles={customSelectStyles}
            isClearable
            isSearchable
          />
        </div>
        <div className="w-64">
          <Select
            options={projectOptions}
            value={projectOptions.find(o => o.value === projectId)}
            onChange={(option: any) => setProjectId(option?.value || '')}
            placeholder={t('pages:candidates.allProjects')}
            styles={customSelectStyles}
            isClearable
            isSearchable
            isDisabled={!clientId}
          />
        </div>
        <div className="w-64">
          <Select
            options={statusOptions}
            value={statusOptions.find(o => o.value === statusFilter)}
            onChange={(option: any) => setStatusFilter(option?.value || '')}
            placeholder={t('pages:candidates.allStatuses')}
            styles={customSelectStyles}
            isClearable
            isSearchable
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
                <TH>{t('pages:candidates.fullName')}</TH>
                <TH>{t('pages:candidates.clientProject')}</TH>
                <TH>{t('pages:candidates.picRecruiter')}</TH>
                <TH>{t('pages:candidates.status')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="py-12 text-center text-slate-400">
                    {t('pages:candidates.noCandidatesMatching')}
                  </TD>
                </TR>
              ) : (
                list.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-bold text-[#0f172a]">
                      {c.full_name || `Candidate #${c.id}`}
                    </TD>
                    <TD>
                      <div className="flex flex-col">
                        <span className="font-bold text-brand text-xs uppercase tracking-wider">{c.client_name || 'No Client'}</span>
                        <span className="text-sm text-slate-500">{c.project_name || 'No Project'}</span>
                      </div>
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-black text-brand">
                          {c.pic_name?.charAt(0) ?? '?'}
                        </div>
                        <span className="text-sm font-medium text-slate-600">{c.pic_name ?? '—'}</span>
                      </div>
                    </TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        c.screening_status === 'hired' ? 'bg-green-100 text-green-700' :
                        c.screening_status === 'rejected' ? 'bg-red-100 text-red-700' :
                        c.screening_status === 'onboarding_completed' ? 'bg-cyan-100 text-cyan-700' :
                        c.screening_status === 'contract_requested' ? 'bg-amber-100 text-amber-700' :
                        c.screening_status === 'onboarding' ? 'bg-teal-100 text-teal-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {c.screening_status.replace(/_/g, ' ')}
                      </span>
                      {c.screening_status === 'onboarding_completed' && (
                        <span className="ml-1.5 text-[10px] text-cyan-600 font-medium normal-case" title={t('pages:candidates.formSubmitted')}>
                          {t('pages:candidates.formSubmitted')}
                        </span>
                      )}
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/candidates/${c.id}`}
                          className="p-2 text-slate-400 hover:text-brand transition-colors"
                          title={t('pages:candidates.viewDetails')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          to={`/candidates/${c.id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                          title={t('common:edit')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
