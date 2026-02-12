import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useToast } from '../components/Toast';
import type { Employee, PaklaringDocument } from '../services/api';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [generateEmployeeId, setGenerateEmployeeId] = useState<string>('');
  const [generateFile, setGenerateFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSearchResults, setEmployeeSearchResults] = useState<Employee[]>([]);
  const [employeeSearching, setEmployeeSearching] = useState(false);
  const { permissions = [] } = useAuth();
  const canCreate = permissions.includes('paklaring:create');
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
  }, [search, page, perPage]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    load();
  }, [load]);

  const searchEmployees = useCallback(async (term: string) => {
    if (!term.trim()) {
      setEmployeeSearchResults([]);
      return;
    }
    setEmployeeSearching(true);
    try {
      const r = await api.getEmployees({ search: term.trim(), per_page: 20 });
      setEmployeeSearchResults(r.data);
    } catch {
      setEmployeeSearchResults([]);
    } finally {
      setEmployeeSearching(false);
    }
  }, []);

  const employeeSearchDebounced = useMemo(() => {
    let t: ReturnType<typeof setTimeout>;
    return (term: string) => {
      clearTimeout(t);
      t = setTimeout(() => searchEmployees(term), 300);
    };
  }, [searchEmployees]);

  useEffect(() => {
    if (!modalOpen) return;
    employeeSearchDebounced(employeeSearch);
  }, [modalOpen, employeeSearch, employeeSearchDebounced]);

  const handleDownload = async (doc: PaklaringDocument) => {
    try {
      const url = await api.getPaklaringPresignedUrl(doc.id);
      await downloadFromUrl(url, `paklaring-${doc.id}.pdf`);
    } catch {
      toast.error(t('pages:paklaring.failedToOpenDocument'));
    }
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateEmployeeId || !generateFile) {
      toast.error(t('pages:paklaring.selectEmployeeAndFile'));
      return;
    }
    const empId = parseInt(generateEmployeeId, 10);
    if (isNaN(empId)) return;
    setUploading(true);
    try {
      await api.uploadPaklaringForEmployee(empId, generateFile);
      toast.success(t('pages:paklaring.paklaringGenerated'));
      setModalOpen(false);
      setGenerateEmployeeId('');
      setGenerateFile(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pages:paklaring.uploadFailed'));
    } finally {
      setUploading(false);
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
            <Button onClick={() => setModalOpen(true)}>{t('pages:paklaring.generatePaklaring')}</Button>
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
                <TH>{t('pages:paklaring.employee')}</TH>
                <TH>{t('pages:paklaring.generated')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={3} className="py-12 text-center text-slate-400">
                    {t('pages:paklaring.noPaklaringFound')}
                  </TD>
                </TR>
              ) : (
                list.map((doc) => (
                  <TR key={doc.id}>
                    <TD className="font-medium text-brand-dark">
                      <Link to={`/employees/${doc.employee_id}`} className="hover:underline">
                        {displayName(doc)}
                      </Link>
                    </TD>
                    <TD className="text-sm text-slate-600">
                      {formatDateLong(doc.generated_at)}
                    </TD>
                    <TD className="text-right">
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

      {canCreate && (
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            if (uploading) return;
            setModalOpen(false);
            setEmployeeSearch('');
            setEmployeeSearchResults([]);
            setGenerateEmployeeId('');
            setGenerateFile(null);
          }}
          title={t('pages:paklaring.generateModalTitle')}
        >
          <form onSubmit={handleGenerateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('pages:paklaring.employeeLabel')}
              </label>
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder={t('pages:paklaring.searchByNamePlaceholder')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand mb-2"
              />
              {employeeSearching && (
                <p className="text-sm text-slate-500">{t('pages:paklaring.searching')}</p>
              )}
              {!employeeSearching && employeeSearch.trim() && (
                <ul className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {employeeSearchResults.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-slate-500">{t('pages:paklaring.noEmployeesFound')}</li>
                  ) : (
                    employeeSearchResults.map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setGenerateEmployeeId(String(e.id));
                            setEmployeeSearch(e.full_name);
                            setEmployeeSearchResults([]);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${generateEmployeeId === String(e.id) ? 'bg-brand/10 text-brand font-medium' : 'text-slate-700'}`}
                        >
                          {e.full_name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
              {generateEmployeeId && (
                <p className="mt-1.5 text-xs text-slate-500">
                  {t('pages:paklaring.selected')}: {employeeSearchResults.find((e) => String(e.id) === generateEmployeeId)?.full_name ?? employeeSearch}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('pages:paklaring.pdfFile')}
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setGenerateFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={uploading}>
                {t('common:cancel')}
              </Button>
              <Button type="submit" disabled={uploading || !generateEmployeeId || !generateFile}>
                {uploading ? t('pages:paklaring.uploading') : t('pages:paklaring.generate')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
