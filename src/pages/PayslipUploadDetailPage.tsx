import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Card, CardBody } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';

const ROWS_PER_PAGE = 50;

export default function PayslipUploadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['pages', 'common']);
  const toast = useToast();
  const [detail, setDetail] = useState<api.PayslipUploadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadDetail = useCallback(async () => {
    const uploadId = id ? parseInt(id, 10) : NaN;
    if (!id || Number.isNaN(uploadId)) {
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const d = await api.getPayslipUploadDetail(uploadId, { page, limit: ROWS_PER_PAGE });
      setDetail(d);
    } catch {
      toast.error(t('pages:payslipUploads.detailLoadError', 'Failed to load upload details'));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id, page, toast, t]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (!id) {
    return (
      <div className="space-y-8">
        <PageHeader title={t('pages:payslipUploads.detailTitle', 'Upload details')} />
        <Card>
          <CardBody className="py-12 text-center text-slate-500">
            {t('pages:payslipUploads.invalidId', 'Invalid upload.')}
            <Link to="/payslips/uploads" className="ml-2 text-brand font-medium hover:underline">
              {t('pages:payslipUploads.backToUploads', 'Back to uploads')}
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const totalPages = detail ? Math.max(1, Math.ceil(detail.total_rows / ROWS_PER_PAGE)) : 1;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:payslipUploads.detailTitle', 'Upload details')}
        subtitle={detail ? (detail.upload.file_name ?? `#${detail.upload.id}`) : undefined}
      />

      <div className="flex items-center gap-4">
        <Link to="/payslips/uploads" className="text-brand font-medium hover:underline text-sm">
          ← {t('pages:payslipUploads.backToUploads', 'Back to uploads')}
        </Link>
      </div>

      {loading ? (
        <Card>
          <CardBody className="py-12 text-center text-slate-500">
            {t('common:loading', 'Loading...')}
          </CardBody>
        </Card>
      ) : !detail ? (
        <Card>
          <CardBody className="py-12 text-center text-slate-500">
            {t('pages:payslipUploads.detailLoadError', 'Failed to load upload details')}
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardBody className="p-6">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500 font-medium">{t('pages:payslipUploads.fileName', 'File')}</dt>
                  <dd className="font-medium mt-0.5">{detail.upload.file_name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">{t('pages:payslipUploads.uploadedAt', 'Uploaded')}</dt>
                  <dd className="mt-0.5">{formatDate(detail.upload.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">{t('pages:payslipUploads.totalRows', 'Total rows')}</dt>
                  <dd className="mt-0.5">{detail.upload.total_rows}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">{t('pages:payslipUploads.successCount', 'OK')} / {t('pages:payslipUploads.errorCount', 'Errors')}</dt>
                  <dd className="mt-0.5">
                    <span className="text-green-600">{detail.upload.success_count}</span>
                    {' / '}
                    <span className={detail.upload.error_count > 0 ? 'text-amber-600' : ''}>{detail.upload.error_count}</span>
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-slate-700">
                {t('pages:payslipUploads.rowDetails', 'Row details')}
                {detail.total_rows > 0 && totalPages > 1 && (
                  <span className="text-slate-500 font-normal ml-2">
                    ({detail.page} / {totalPages})
                  </span>
                )}
              </h3>
              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={detail.total_rows}
                  perPage={ROWS_PER_PAGE}
                  onPageChange={setPage}
                />
              )}
            </div>
            {detail.rows.length === 0 ? (
              <CardBody className="py-12 text-center text-slate-500 text-sm">
                {t('pages:payslipUploads.noRows', 'No row details.')}
              </CardBody>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>{t('pages:payslipUploads.rowNumber', 'Row')}</TH>
                    <TH>{t('pages:payslipUploads.status', 'Status')}</TH>
                    <TH>{t('pages:payslipUploads.message', 'Message')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {detail.rows.map((r) => (
                    <TR key={r.id}>
                      <TD>{r.row_number}</TD>
                      <TD>
                        <span className={r.status === 'error' ? 'text-amber-600 font-medium' : 'text-green-600'}>
                          {r.status === 'error' ? t('pages:payslipUploads.statusError', 'Error') : t('pages:payslipUploads.statusSuccess', 'OK')}
                        </span>
                      </TD>
                      <TD className="max-w-xl text-sm whitespace-pre-wrap">{r.error_message ?? '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex justify-center">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={detail.total_rows}
                  perPage={ROWS_PER_PAGE}
                  onPageChange={setPage}
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
