import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useToast } from '../components/Toast';
import type { PaklaringDocument } from '../services/api';
import * as api from '../services/api';
import { downloadFromUrl } from '../utils/download.ts';
import { formatDateLong } from '../utils/formatDate';

const DEBOUNCE_MS = 350;

export default function PaklaringPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [list, setList] = useState<PaklaringDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const { permissions = [] } = useAuth();
  const canCreate = permissions.includes('paklaring:create');
  const canDelete = permissions.includes('paklaring:delete');
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPaklarings({
        search: search.trim() || undefined,
        page,
        per_page: perPage,
      });
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:paklaring.loadError'));
    } finally {
      setLoading(false);
    }
  }, [search, page, perPage, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async (doc: PaklaringDocument) => {
    try {
      const url = await api.getPaklaringPresignedUrl(doc.id);
      await downloadFromUrl(url, `paklaring-${doc.id}.pdf`);
    } catch {
      toast.error(t('pages:paklaring.failedToOpenDocument'));
    }
  };

  const handleDelete = async (doc: PaklaringDocument) => {
    if (!window.confirm(t('pages:paklaring.confirmDelete'))) return;
    try {
      await api.deletePaklaring(doc.id);
      toast.success(t('pages:paklaring.deleted'));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages:paklaring.loadError'));
    }
  };

  const displayName = (doc: PaklaringDocument) =>
    doc.employee_name?.trim() || `Employee #${doc.employee_id}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:paklaring.title')}
        subtitle={t('pages:paklaring.subtitle')}
        actions={
          canCreate ? (
            <Link to="/paklaring/new">
              <Button>{t('pages:paklaring.generatePaklaring')}</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 min-w-[200px] max-w-md">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {t('pages:paklaring.searchByEmployeeName')}
          </label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('pages:paklaring.typeToFilter')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
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
                <TH>{t('pages:paklaring.documentNumber')}</TH>
                <TH>{t('pages:paklaring.employee')}</TH>
                <TH>{t('pages:paklaring.lastWorkingDate')}</TH>
                <TH>{t('pages:paklaring.generated')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="py-12 text-center text-slate-400">
                    {t('pages:paklaring.noPaklaringFound')}
                  </TD>
                </TR>
              ) : (
                list.map((doc) => (
                  <TR key={doc.id}>
                    <TD className="text-sm font-medium text-slate-700">
                      {doc.document_number || '—'}
                    </TD>
                    <TD className="font-medium text-brand-dark">
                      <Link to={`/employees/${doc.employee_id}`} className="hover:underline">
                        {displayName(doc)}
                      </Link>
                    </TD>
                    <TD className="text-sm text-slate-600">
                      {doc.last_working_date ? formatDateLong(doc.last_working_date) : '—'}
                    </TD>
                    <TD className="text-sm text-slate-600">
                      {formatDateLong(doc.generated_at)}
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-0">
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-slate-400 hover:text-brand transition-colors"
                          title={t('common:download')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(doc)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            title={t('common:delete')}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
