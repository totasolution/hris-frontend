import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import * as api from '../services/api';
import type { WarningLetter } from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function MyWarningsPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [list, setList] = useState<WarningLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMyWarnings()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : t('pages:myWarnings.loadError')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:myWarnings.title')}
        subtitle={t('pages:myWarnings.subtitle')}
      />

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
                <TH>{t('pages:warnings.documentNumber')}</TH>
                <TH>{t('pages:myWarnings.warningType')}</TH>
                <TH>{t('pages:myWarnings.issuedDate')}</TH>
                <TH>{t('pages:warnings.description')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="py-12 text-center text-slate-400">
                    {t('pages:myWarnings.noWarnings')}
                  </TD>
                </TR>
              ) : (
                list.map((w) => (
                  <TR key={w.id}>
                    <TD className="text-slate-700 font-mono text-sm">{w.document_number ?? '—'}</TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        w.type === 'SP3' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {w.type}
                      </span>
                    </TD>
                    <TD>{w.warning_date ? formatDate(w.warning_date) : '—'}</TD>
                    <TD className="max-w-md whitespace-normal text-slate-500">{w.description ?? '—'}</TD>
                    <TD className="text-right">
                      <Link
                        to={`/warnings/${w.id}`}
                        state={{ from: 'me' }}
                        className="inline-flex p-2 text-slate-400 hover:text-brand transition-colors"
                        title={t('pages:warnings.viewDetail')}
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
        </Card>
      )}
    </div>
  );
}
