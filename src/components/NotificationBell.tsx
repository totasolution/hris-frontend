import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import { useToast } from './Toast';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<api.Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const loadNotifications = async () => {
    try {
      const [list, count] = await Promise.all([
        api.getNotifications({ limit: 10 }),
        api.getUnreadNotificationCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-brand transition-colors rounded-xl hover:bg-slate-50"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+1rem)] right-0 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-[600px] flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-brand-dark">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-bold text-brand hover:text-brand-dark transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-slate-400 font-medium">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !notif.read_at ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => {
                      if (!notif.read_at) {
                        handleMarkAsRead(notif.id);
                      }
                      if (notif.link_url) {
                        window.location.href = notif.link_url;
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-2 ${
                        !notif.read_at ? 'bg-brand' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-brand-dark leading-snug">{notif.title}</p>
                        {notif.body && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.body}</p>
                        )}
                        <p className="text-[10px] text-slate-400 font-medium mt-2">
                          {formatTimeAgo(notif.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="flex-shrink-0 p-1 text-slate-300 hover:text-red-500 transition-colors"
                        aria-label="Delete notification"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-brand hover:text-brand-dark transition-colors text-center block"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
