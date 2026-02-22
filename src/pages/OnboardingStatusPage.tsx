import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Client, OnboardingStatusItem } from '../services/api';
import * as api from '../services/api';
import { formatDateLong } from '../utils/formatDate';

const customSelectStyles = {
  control: (base: any) => ({
    ...base,
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    padding: '2px',
    boxShadow: 'none',
    '&:hover': { border: '1px solid #107BC7' },
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#107BC7' : state.isFocused ? '#E8F5FF' : 'white',
    color: state.isSelected ? 'white' : '#282828',
    fontSize: '0.875rem',
    fontWeight: '500',
  }),
  placeholder: (base: any) => ({ ...base, fontSize: '0.875rem', color: '#94a3b8', fontWeight: '500' }),
  singleValue: (base: any) => ({ ...base, fontSize: '0.875rem', fontWeight: '600', color: '#282828' }),
};

function getOnboardingUrl(token: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/onboarding/${token}`;
}

export default function OnboardingStatusPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [list, setList] = useState<OnboardingStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [clients, setClients] = useState<Client[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { search?: string; client_id?: number; page?: number; per_page?: number } = {
        page,
        per_page: perPage,
      };
      if (searchName.trim()) params.search = searchName.trim();
      if (clientId) params.client_id = parseInt(clientId, 10);
      const res = await api.getOnboardingStatusList(params);
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:onboardingStatus.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchName, clientId]);

  useEffect(() => {
    load();
  }, [searchName, clientId, page]);

  useEffect(() => {
    api.getClients().then(setClients).catch(() => {});
  }, []);

  const clientOptions = clients.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <div className="space-y-8 font-body">
      <PageHeader
        title={t('pages:onboardingStatus.title')}
        subtitle={t('pages:onboardingStatus.subtitle')}
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <input
            type="text"
            placeholder={t('pages:onboardingStatus.searchCandidate')}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <div className="w-64">
          <Select
            options={clientOptions}
            value={clientOptions.find((o) => o.value === clientId)}
            onChange={(option: any) => setClientId(option?.value || '')}
            placeholder={t('pages:onboardingStatus.allClients')}
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
                <TH>{t('pages:onboardingStatus.candidateName')}</TH>
                <TH>{t('pages:onboardingStatus.onboardingUrl')}</TH>
                <TH>{t('pages:onboardingStatus.createdDate')}</TH>
                <TH>{t('pages:onboardingStatus.status')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    {t('pages:onboardingStatus.noItems')}
                  </TD>
                </TR>
              ) : (
                list.map((item) => (
                  <TR key={`${item.candidate_id}-${item.token}`}>
                    <TD className="font-bold text-[#0f172a]">
                      <Link to={`/candidates/${item.candidate_id}`} className="text-brand hover:underline">
                        {item.candidate_name || `Candidate #${item.candidate_id}`}
                      </Link>
                    </TD>
                    <TD>
                      <a
                        href={getOnboardingUrl(item.token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand text-sm font-medium hover:underline break-all"
                      >
                        {getOnboardingUrl(item.token)}
                      </a>
                    </TD>
                    <TD className="text-slate-600 text-sm">
                      {formatDateLong(item.created_at)}
                    </TD>
                    <TD>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          item.status === 'need_follow_up'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status === 'need_follow_up'
                          ? t('pages:onboardingStatus.needFollowUp')
                          : t('pages:onboardingStatus.new')}
                      </span>
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
