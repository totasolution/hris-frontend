import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useAuth } from '../contexts/AuthContext';
import type { Announcement } from '../services/api';
import * as api from '../services/api';
import { useToast } from '../components/Toast';

const PER_PAGE = 10;

export default function AnnouncementsPage() {
  const { t } = useTranslation(['pages', 'common']);
  const { permissions = [] } = useAuth();
  const canManage = permissions.includes('announcement:manage');
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [clients, setClients] = useState<api.Client[]>([]);
  const [detailAnnouncement, setDetailAnnouncement] = useState<Announcement | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (canManage) api.getClients().then(setClients).catch(() => {});
  }, [canManage]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnnouncements({
        publishedOnly: !canManage,
        page,
        per_page: PER_PAGE,
      });
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:announcements.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [canManage, page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('pages:announcements.deleteConfirm'))) return;
    try {
      await api.deleteAnnouncement(id);
      toast.success(t('pages:announcements.deletedSuccess'));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages:announcements.loadError'));
    }
  };

  const truncate = (s: string, max: number) =>
    s.length <= max ? s : s.slice(0, max) + '...';

  const detailClientName = detailAnnouncement?.client_id != null && canManage
    ? (clients.find((c) => c.id === detailAnnouncement.client_id)?.name ?? String(detailAnnouncement.client_id))
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:announcements.title')}
        subtitle={t('pages:announcements.subtitle')}
        actions={
          canManage ? (
            <ButtonLink to="/announcements/new">{t('pages:announcements.newAnnouncement')}</ButtonLink>
          ) : undefined
        }
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
                <TH>{t('pages:announcementForm.title')}</TH>
                <TH>{t('pages:announcements.detail')}</TH>
                {canManage && <TH className="w-32">{t('common:actions')}</TH>}
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={canManage ? 3 : 2} className="py-12 text-center text-slate-400">
                    {t('pages:announcements.noAnnouncements')}
                  </TD>
                </TR>
              ) : (
                list.map((a) => (
                  <TR key={a.id}>
                    <TD className="font-medium align-top">{a.title}</TD>
                    <TD className="text-slate-600 align-top">
                      <div className="max-w-xl">
                        <span className="line-clamp-2">{truncate(a.body, 200)}</span>
                        <button
                          type="button"
                          onClick={() => setDetailAnnouncement(a)}
                          className="mt-1 text-sm font-medium text-brand hover:underline"
                        >
                          {t('pages:announcements.viewFull')}
                        </button>
                      </div>
                    </TD>
                    {canManage && (
                      <TD className="align-top">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/announcements/${a.id}/edit`}
                            className="p-2 text-slate-400 hover:text-brand transition-colors inline-block"
                            title={t('pages:announcements.edit')}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors inline-block"
                            title={t('pages:announcements.delete')}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </TD>
                    )}
                  </TR>
                ))
              )}
            </TBody>
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={PER_PAGE}
            onPageChange={setPage}
          />
        </Card>
      )}

      <Modal
        isOpen={detailAnnouncement != null}
        onClose={() => setDetailAnnouncement(null)}
        title={detailAnnouncement?.title ?? ''}
        footer={
          <Button variant="secondary" onClick={() => setDetailAnnouncement(null)}>
            {t('pages:announcements.close')}
          </Button>
        }
      >
        <div className="space-y-4">
          {detailClientName != null && (
            <p className="text-sm text-slate-500">
              <span className="font-semibold">{t('pages:announcementForm.client')}:</span> {detailClientName}
            </p>
          )}
          <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-slate-700">
            {detailAnnouncement?.body ?? ''}
          </div>
        </div>
      </Modal>
    </div>
  );
}
