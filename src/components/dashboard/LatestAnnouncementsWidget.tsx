import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardBody } from '../Card';
import type { Announcement } from '../../services/api';
import * as api from '../../services/api';
import { formatDate } from '../../utils/formatDate';

const LIMIT = 5;

type LatestAnnouncementsWidgetProps = {
  permissions: string[];
};

export function LatestAnnouncementsWidget({ permissions }: LatestAnnouncementsWidgetProps) {
  const { t } = useTranslation(['nav', 'pages']);
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const canSee = permissions.includes('announcement:read');

  useEffect(() => {
    if (!canSee) {
      setLoading(false);
      return;
    }
    api
      .getAnnouncements({ publishedOnly: true })
      .then((data) => setList(data.slice(0, LIMIT)))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [canSee]);

  if (!canSee) return null;

  return (
    <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-brand-dark font-headline">{t('nav:announcements')}</h3>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
            Latest updates
          </p>
        </div>
        <Link
          to="/announcements"
          className="text-sm font-bold text-brand hover:underline uppercase tracking-widest"
        >
          View all
        </Link>
      </CardHeader>
      <CardBody className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="text-slate-400 text-sm p-4">{t('pages:announcements.noAnnouncements')}</p>
        ) : (
          <ul className="space-y-3">
            {list.map((a) => (
              <li key={a.id}>
                <Link
                  to="/announcements"
                  className="block rounded-xl p-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <p className="font-medium text-slate-800 line-clamp-1">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {a.published_from ? formatDate(a.published_from) : formatDate(a.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
