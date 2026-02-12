import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useAuth } from '../contexts/AuthContext';
import type { Announcement } from '../services/api';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';
import { useToast } from '../components/Toast';

export default function AnnouncementsPage() {
  const { t } = useTranslation(['pages', 'common']);
  const { permissions = [] } = useAuth();
  const canManage = permissions.includes('announcement:manage');
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAnnouncements({
        publishedOnly: !canManage,
      });
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:announcements.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [canManage]);

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
                <TH className="max-w-xs">{t('pages:announcementForm.body')}</TH>
                <TH>{t('pages:announcements.publishedFrom')}</TH>
                <TH>{t('pages:announcements.publishedUntil')}</TH>
                {canManage && <TH className="w-32">{t('common:actions')}</TH>}
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={canManage ? 5 : 4} className="py-12 text-center text-slate-400">
                    {t('pages:announcements.noAnnouncements')}
                  </TD>
                </TR>
              ) : (
                list.map((a) => (
                  <TR key={a.id}>
                    <TD className="font-medium">{a.title}</TD>
                    <TD className="max-w-xs text-slate-600">{truncate(a.body, 80)}</TD>
                    <TD className="text-slate-600">
                      {a.published_from ? formatDate(a.published_from) : '—'}
                    </TD>
                    <TD className="text-slate-600">
                      {a.published_until ? formatDate(a.published_until) : '—'}
                    </TD>
                    {canManage && (
                      <TD>
                        <div className="flex gap-2">
                          <Link
                            to={`/announcements/${a.id}/edit`}
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            {t('pages:announcements.edit')}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            className="text-sm font-medium text-red-600 hover:underline"
                          >
                            {t('pages:announcements.delete')}
                          </button>
                        </div>
                      </TD>
                    )}
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
