import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import type { PayslipUpload } from '../services/api';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';

const UPLOADS_PER_PAGE = 20;

export default function PayslipUploadsPage() {
  const { t } = useTranslation(['pages', 'nav', 'common']);
  const { permissions = [] } = useAuth();
  const canUpload = permissions.includes('payslip:create');
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<PayslipUpload[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadUploads = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.listPayslipUploads({ page, limit: UPLOADS_PER_PAGE });
      setUploads(result.data);
      setTotal(result.total);
    } catch {
      setUploads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error(t('pages:payslips.addRowError'));
      return;
    }
    setUploading(true);
    try {
      const res = await api.bulkUploadPayslipsFromCSV(file);
      const created = res.count ?? 0;
      const failedCount = res.failed?.length ?? 0;
      if (failedCount > 0) {
        // Partial or full failure: upload was still recorded on the server
        if (created > 0) {
          toast.warning(
            t('pages:payslipUploads.partialSuccess', {
              count: created,
              failed: failedCount,
              defaultValue: '{{count}} payslips created, {{failed}} rows had errors. Upload recorded.',
            })
          );
        } else {
          toast.warning(
            t('pages:payslipUploads.allFailedRecorded', {
              failed: failedCount,
              defaultValue: 'No payslips created; {{failed}} rows had errors. Upload recorded.',
            })
          );
        }
      } else {
        toast.success(t('pages:payslips.payslipsUploaded'));
      }
      setFile(null);
      setPage(1);
      try {
        const result = await api.listPayslipUploads({ page: 1, limit: UPLOADS_PER_PAGE });
        setUploads(result.data);
        setTotal(result.total);
      } catch {
        loadUploads();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pages:payslips.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / UPLOADS_PER_PAGE));

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('nav:payslipUploads')}
        subtitle={t('pages:payslipUploads.subtitle', 'View history of CSV uploads and any row-level errors.')}
      />

      {canUpload && (
        <Card>
          <div className="p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              {t('pages:payslips.bulkUploadCSVTitle', 'Upload payslips from CSV')}
            </h3>
            <p className="text-xs text-slate-500">
              {t(
                'pages:payslips.bulkUploadCSVHelp',
                'Upload a .csv file with columns: nik, year, month, city, print_date (YYYY-MM-DD), prepared_by, gaji, tunjangan_transportasi, insentif, lembur_luar_kota, rapel_salary, refund, kompensasi, bpjs_naker, bpjs_pensiun, bpjs_kesehatan, pph21, admin_bank, denda, rapel_potongan_bpjs, bpjs_ketenagakerjaan_id, bpjs_kesehatan_id.'
              )}
            </p>
            <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                className="text-slate-600 max-w-xs text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    const blob = await api.downloadPayslipCSVTemplate();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'payslip_template.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : t('pages:payslips.uploadFailed'));
                  }
                }}
              >
                {t('pages:payslips.downloadTemplate', 'Download template')}
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? t('pages:payslips.uploading') : t('pages:payslips.uploadPayslips')}
              </Button>
            </form>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">
            {t('pages:payslipUploads.historyTitle', 'Upload history')}
          </h3>
          <Link to="/payslips" className="text-brand text-sm font-medium hover:underline">
            {t('pages:payslipUploads.backToPayslips', 'Back to Payslips')}
          </Link>
        </div>
        {loading ? (
          <CardBody className="py-8 text-center text-slate-500 text-sm">
            {t('common:loading', 'Loading...')}
          </CardBody>
        ) : uploads.length === 0 ? (
          <CardBody className="py-12 text-center">
            <p className="text-slate-500 mb-4">
              {t('pages:payslipUploads.emptyState', 'Upload history will appear here after you upload a CSV.')}
            </p>
          </CardBody>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t('pages:payslipUploads.fileName', 'File')}</TH>
                <TH>{t('pages:payslipUploads.uploadedBy', 'Uploaded by')}</TH>
                <TH>{t('pages:payslipUploads.uploadedAt', 'Uploaded')}</TH>
                <TH>{t('pages:payslipUploads.totalRows', 'Rows')}</TH>
                <TH>{t('pages:payslipUploads.successCount', 'OK')}</TH>
                <TH>{t('pages:payslipUploads.errorCount', 'Errors')}</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {uploads.map((u) => (
                <TR key={u.id}>
                  <TD className="font-medium">{u.file_name ?? '—'}</TD>
                  <TD>{u.uploaded_by_name ?? '—'}</TD>
                  <TD>{formatDate(u.created_at)}</TD>
                  <TD>{u.total_rows}</TD>
                  <TD>{u.success_count}</TD>
                  <TD>{u.error_count > 0 ? <span className="text-amber-600">{u.error_count}</span> : u.error_count}</TD>
                  <TD>
                    <Link
                      to={`/payslips/uploads/${u.id}`}
                      className="text-brand font-medium hover:underline text-sm"
                    >
                      {t('pages:payslipUploads.viewDetails', 'View details')}
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        {!loading && total > UPLOADS_PER_PAGE && (
          <div className="border-t border-slate-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              perPage={UPLOADS_PER_PAGE}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
