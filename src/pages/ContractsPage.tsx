import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { Select } from '../components/Select';
import ReactSelect from 'react-select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Contract } from '../services/api';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';

const clientSelectStyles = {
  control: (base: object) => ({
    ...base,
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    minHeight: '42px',
    boxShadow: 'none',
    '&:hover': { border: '1px solid #107BC7' },
  }),
  option: (base: object, state: { isSelected?: boolean; isFocused?: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? '#107BC7' : state.isFocused ? '#E8F5FF' : 'white',
    color: state.isSelected ? 'white' : '#282828',
    fontSize: '0.875rem',
  }),
  placeholder: (base: object) => ({ ...base, fontSize: '0.875rem', color: '#94a3b8' }),
  singleValue: (base: object) => ({ ...base, fontSize: '0.875rem', color: '#282828', fontWeight: 600 }),
  menu: (base: object) => ({ ...base, zIndex: 20 }),
};

export default function ContractsPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [list, setList] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [clients, setClients] = useState<api.Client[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getContracts({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        client_id: clientId ? parseInt(clientId, 10) : undefined,
        page,
        per_page: perPage,
      });
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setSelectedIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:contracts.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, clientId, search, page, perPage]);

  useEffect(() => {
    api.getClients().then(setClients).catch(() => {});
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allOnPageSelected = list.length > 0 && list.every((c) => selectedIds.has(c.id));
  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) list.forEach((c) => next.delete(c.id));
      else list.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleDelete = async (c: Contract) => {
    if (!window.confirm(`Hapus kontrak ${c.contract_number || `#${c.id}`} (${c.employee_name ?? ''})? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingId(c.id);
    try {
      await api.deleteContract(c.id);
      toast.success('Kontrak dihapus.');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus kontrak');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Hapus ${ids.length} kontrak terpilih? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBulkDeleting(true);
    try {
      const deleted = await api.bulkDeleteContracts(ids);
      toast.success(`${deleted} kontrak dihapus.`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus kontrak');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDownload = async (c: Contract) => {
    try {
      await api.downloadContractDocument(c.id);
    } catch (e) {
      toast.error(t('pages:contracts.downloadFailed'));
    }
  };

  const handlePreview = async (c: Contract) => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewUrl(null);
    setPreviewTitle(c.contract_number || `Contract #${c.id}`);
    try {
      const url = await api.getContractPresignedUrl(c.id);
      setPreviewUrl(url);
    } catch (e) {
      toast.error(t('pages:contracts.downloadFailed'));
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
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
        <div className="w-64">
          <ReactSelect
            options={[
              { value: '', label: t('pages:contracts.allClients', 'All clients') },
              ...clients.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            value={
              clientId
                ? { value: clientId, label: clients.find((c) => String(c.id) === clientId)?.name ?? clientId }
                : { value: '', label: t('pages:contracts.allClients', 'All clients') }
            }
            onChange={(opt: { value: string; label: string } | null) => { setClientId(opt?.value ?? ''); setPage(1); }}
            placeholder={t('pages:contracts.allClients', 'All clients')}
            styles={clientSelectStyles}
            isSearchable
            isClearable
          />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-red-700">{selectedIds.size} terpilih</span>
          <button type="button" onClick={() => setSelectedIds(new Set())} className="text-sm font-medium text-slate-500 hover:text-slate-700">
            Batal
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {bulkDeleting ? 'Menghapus…' : `Hapus ${selectedIds.size} kontrak`}
          </button>
        </div>
      )}

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
                <TH className="w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                    title="Pilih semua di halaman ini"
                  />
                </TH>
                <TH>{t('pages:contracts.contract')}</TH>
                <TH>{t('pages:contracts.employee')}</TH>
                <TH>{t('common:status')}</TH>
                <TH>{t('pages:contracts.createdDate')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="py-12 text-center text-slate-400">
                    {t('pages:contracts.noContractsFound')}
                  </TD>
                </TR>
              ) : (
                list.map((c) => (
                  <TR key={c.id}>
                    <TD className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                      />
                    </TD>
                    <TD>
                      <div className="font-bold text-[#0f172a]">
                        {c.contract_number || `#${c.id}`}
                      </div>
                      {!c.contract_number && (
                        <div className="text-xs text-slate-400">ID: {c.id}</div>
                      )}
                    </TD>
                    <TD>
                      <span className="text-sm text-slate-700">{c.employee_name || '—'}</span>
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
                          <>
                            <button
                              onClick={() => handlePreview(c)}
                              className="p-2 text-slate-400 hover:text-brand transition-colors"
                              title={t('common:preview')}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDownload(c)}
                              className="p-2 text-slate-400 hover:text-brand transition-colors"
                              title={t('pages:contracts.downloadDocument')}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c.id}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40"
                          title={t('common:delete', 'Delete')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
            onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            onPageChange={setPage}
          />
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
