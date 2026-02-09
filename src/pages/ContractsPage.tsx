import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { Select } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Contract } from '../services/api';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function ContractsPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [list, setList] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getContracts({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        page,
        per_page: perPage,
      });
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:contracts.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, search, page]);

  const handleDownload = async (c: Contract) => {
    try {
      const url = await api.getContractPresignedUrl(c.id);
      window.open(url, '_blank');
    } catch (e) {
      toast.error(t('pages:contracts.downloadFailed'));
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:contracts.title')}
        subtitle={t('pages:contracts.subtitle')}
        actions={<ButtonLink to="/contracts/new">{t('pages:contracts.newContract')}</ButtonLink>}
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <input
            type="text"
            placeholder={t('pages:contracts.searchPlaceholder')}
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('pages:contracts.allStatuses')}</option>
            <option value="draft">{t('pages:contracts.statusDraft')}</option>
            <option value="sent_for_signature">{t('pages:contracts.statusSentForSignature')}</option>
            <option value="signed">{t('pages:contracts.statusSigned')}</option>
            <option value="expired">{t('pages:contracts.statusExpired')}</option>
            <option value="cancelled">{t('pages:contracts.statusCancelled')}</option>
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
                <TH>{t('pages:contracts.contract')}</TH>
                <TH>{t('common:status')}</TH>
                <TH>{t('pages:contracts.createdDate')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    {t('pages:contracts.noContractsFound')}
                  </TD>
                </TR>
              ) : (
                list.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <div className="font-bold text-[#0f172a]">
                        {c.contract_number || `#${c.id}`}
                      </div>
                      {(c.candidate_name || c.employee_name) && (
                        <div className="text-sm text-slate-600 mt-1">
                          {c.employee_name || c.candidate_name}
                        </div>
                      )}
                      {!c.contract_number && !c.candidate_name && !c.employee_name && (
                        <div className="text-xs text-slate-400">ID: {c.id}</div>
                      )}
                    </TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        c.status === 'signed' ? 'bg-green-100 text-green-700' :
                        c.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        c.status === 'sent_for_signature' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </TD>
                    <TD>{c.created_at ? formatDate(c.created_at) : '—'}</TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/contracts/${c.id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                          title={t('pages:contracts.editContract')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        {c.file_path && (
                          <button
                            onClick={() => handleDownload(c)}
                            className="p-2 text-slate-400 hover:text-brand transition-colors"
                            title={t('pages:contracts.downloadDocument')}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
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
