import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<api.Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const toast = useToast();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const list = await api.getNotifications({ unread: unreadOnly });
      setNotifications(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      await loadNotifications();
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      await loadNotifications();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteNotification(id);
      await loadNotifications();
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(date);
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="space-y-8 font-body">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with your activities"
        actions={
          unreadCount > 0 ? (
            <Button onClick={handleMarkAllAsRead} variant="secondary">
              Mark all as read
            </Button>
          ) : null
        }
      />

      <div className="flex gap-4 items-center">
        <button
          onClick={() => setUnreadOnly(!unreadOnly)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            unreadOnly
              ? 'bg-brand text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Unread Only
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-slate-400 font-medium">No notifications found</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card key={notif.id} className={`${!notif.read_at ? 'border-l-4 border-l-brand' : ''}`}>
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-2 ${
                    !notif.read_at ? 'bg-brand' : 'bg-transparent'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-brand-dark mb-1">{notif.title}</h3>
                        {notif.body && (
                          <p className="text-sm text-slate-600 mb-2">{notif.body}</p>
                        )}
                        <p className="text-xs text-slate-400 font-medium">
                          {formatTimeAgo(notif.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notif.read_at && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="px-3 py-1 text-xs font-bold text-brand hover:bg-brand-lighter rounded-lg transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                        {notif.link_url && (
                          <Link
                            to={notif.link_url}
                            className="px-3 py-1 text-xs font-bold text-brand hover:bg-brand-lighter rounded-lg transition-colors"
                          >
                            View
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          aria-label="Delete notification"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
