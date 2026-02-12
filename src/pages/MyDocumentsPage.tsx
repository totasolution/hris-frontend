import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import * as api from '../services/api';
import { downloadFromUrl } from '../utils/download.ts';

export default function MyDocumentsPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [list, setList] = useState<api.PaklaringDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    api.getMyPaklaring()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : t('pages:myDocuments.loadError')))
      .finally(() => setLoading(false));
  }, []);

  const download = async (id: number) => {
    try {
      const url = await api.getPaklaringPresignedUrl(id);
      await downloadFromUrl(url, `document-${id}.pdf`);
    } catch {
      toast.error(t('pages:myDocuments.downloadFailed'));
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:myDocuments.title')}
        subtitle={t('pages:myDocuments.subtitle')}
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
                <TH>{t('pages:myDocuments.documentType')}</TH>
                <TH>{t('pages:myDocuments.generatedDate')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={3} className="py-12 text-center text-slate-400">
                    {t('pages:myDocuments.noDocumentsFound')}
                  </TD>
                </TR>
              ) : (
                list.map((d) => (
                  <TR key={d.id}>
                    <TD className="font-bold text-[#0f172a]">{t('pages:myDocuments.employmentReference')}</TD>
                    <TD>{d.generated_at ? new Date(d.generated_at).toLocaleString() : '—'}</TD>
                    <TD className="text-right">
                      <button
                        onClick={() => download(d.id)}
                        className="p-2 text-slate-400 hover:text-brand transition-colors inline-block"
                        title={t('pages:myDocuments.downloadPdf')}
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
        </Card>
      )}
    </div>
  );
}
