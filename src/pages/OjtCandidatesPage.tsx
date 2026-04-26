import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Label, FormGroup } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useAuth } from '../contexts/AuthContext';
import type { Candidate, Client } from '../services/api';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';
import { screeningStatusDisplay } from '../utils/mergeCandidate';
import Select from 'react-select';

const customSelectStyles = {
  control: (base: any) => ({
    ...base,
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    padding: '2px',
    boxShadow: 'none',
    minHeight: '44px',
    '&:hover': { border: '1px solid #107BC7' },
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#107BC7' : state.isFocused ? '#E8F5FF' : 'white',
    color: state.isSelected ? 'white' : '#282828',
    fontSize: '0.875rem',
    fontWeight: '500',
  }),
};

export default function OjtCandidatesPage() {
  const { t } = useTranslation(['pages', 'common']);
  const { permissions = [] } = useAuth();
  const canRead = permissions.includes('candidate:read');
  const hasFullRecruitmentAccess = permissions.includes('recruitment:full_recruitment_access');
  const [list, setList] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  const load = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOjtCandidates(
        {
          client_id: clientId ? parseInt(clientId, 10) : undefined,
          page,
          per_page: perPage,
        }
      );
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:ojtCandidates.loadError'));
    } finally {
      setLoading(false);
    }
  }, [canRead, clientId, page, perPage, t]);

  useEffect(() => {
    if (!canRead) return;
    void load();
  }, [canRead, load]);

  useEffect(() => {
    if (hasFullRecruitmentAccess) {
      api.getClients().then(setClients).catch(() => {});
    }
  }, [hasFullRecruitmentAccess]);

  const handleClientChange = (v: string) => {
    setClientId(v);
    setPage(1);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      await api.downloadOjtCandidatesXlsx(
        clientId ? { client_id: parseInt(clientId, 10) } : undefined
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:ojtCandidates.downloadError'));
    } finally {
      setDownloading(false);
    }
  };

  if (!canRead) {
    return (
      <div className="space-y-8 font-body">
        <p className="text-center py-12 text-slate-600">{t('pages:ojtCandidates.forbidden')}</p>
      </div>
    );
  }

  const clientOptions = clients.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <div className="space-y-8 font-body">
      <PageHeader
        title={t('pages:ojtCandidates.title')}
        subtitle={t('pages:ojtCandidates.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void handleDownload()}
              disabled={downloading || loading}
            >
              {downloading ? t('pages:ojtCandidates.downloading') : t('pages:ojtCandidates.downloadXlsx')}
            </Button>
          </div>
        }
      />

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {hasFullRecruitmentAccess && (
            <FormGroup>
              <Label>{t('pages:candidates.filterClient')}</Label>
              <Select
                options={clientOptions}
                value={clientOptions.find((o) => o.value === clientId) ?? null}
                onChange={(o: { value: string; label: string } | null) => handleClientChange(o?.value ?? '')}
                placeholder={t('pages:ojtCandidates.filterClient')}
                styles={customSelectStyles}
                isClearable
                isSearchable
              />
            </FormGroup>
          )}
          <div className="lg:col-span-2 flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="sm:flex-1" />
            <Button type="button" onClick={() => void load()} disabled={loading} className="w-full sm:w-auto whitespace-nowrap">
              {t('pages:candidates.searchButton')}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('pages:ojtCandidates.colName')}</TH>
                <TH>{t('pages:ojtCandidates.colEmail')}</TH>
                <TH>{t('pages:ojtCandidates.colClient')}</TH>
                <TH>{t('pages:ojtCandidates.colPic')}</TH>
                <TH>{t('pages:ojtCandidates.colPosition')}</TH>
                <TH>{t('pages:ojtCandidates.colOjtStart')}</TH>
                <TH>{t('pages:ojtCandidates.colOjtEnd')}</TH>
                <TH>{t('pages:candidates.status')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={8} className="py-12 text-center text-slate-400">
                    {t('pages:ojtCandidates.empty')}
                  </TD>
                </TR>
              ) : (
                list.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <Link to={`/candidates/${c.id}`} className="font-bold text-brand hover:underline">
                        {c.full_name}
                      </Link>
                    </TD>
                    <TD className="text-slate-600 text-sm">{c.email}</TD>
                    <TD>{c.client_name ?? '—'}</TD>
                    <TD>{c.pic_name ?? '—'}</TD>
                    <TD>{c.position ?? '—'}</TD>
                    <TD>
                      {c.ojt_start_date
                        ? formatDate(c.ojt_start_date, { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </TD>
                    <TD>
                      {c.ojt_end_date
                        ? formatDate(c.ojt_end_date, { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </TD>
                    <TD>
                      <span className="text-xs font-bold uppercase text-teal-700">
                        {screeningStatusDisplay(c.screening_status)}
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
