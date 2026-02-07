import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../Card';

type ActivityItem = {
  id: number | string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  link?: string;
  icon?: React.ReactNode;
  avatar?: string;
};

type RecentActivityProps = {
  title?: string;
  subtitle?: string;
  items: ActivityItem[];
  loading?: boolean;
  emptyMessage?: string;
  viewAllLink?: string;
  className?: string;
};

export function RecentActivity({
  title = 'Recent Activity',
  subtitle,
  items,
  loading = false,
  emptyMessage = 'No recent activity',
  viewAllLink,
  className = '',
}: RecentActivityProps) {
  return (
    <Card className={`rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/50 h-full flex flex-col ${className}`}>
      <CardHeader>
        <h3 className="text-lg font-bold text-brand-dark font-headline">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">{subtitle}</p>
        )}
      </CardHeader>
      <CardBody className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const content = (
                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                  {item.avatar ? (
                    <div className="h-10 w-10 rounded-xl bg-brand-lighter flex items-center justify-center text-brand font-bold text-xs group-hover:scale-110 transition-transform">
                      {item.avatar}
                    </div>
                  ) : item.icon ? (
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      {item.icon}
                    </div>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-brand-dark truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                        {item.subtitle}
                      </p>
                    )}
                    {item.timestamp && (
                      <p className="text-xs text-slate-400 mt-1">{item.timestamp}</p>
                    )}
                  </div>
                  {item.link && (
                    <span className="text-slate-300 group-hover:text-brand transition-colors">→</span>
                  )}
                </div>
              );

              if (item.link) {
                return (
                  <Link key={item.id} to={item.link}>
                    {content}
                  </Link>
                );
              }

              return <div key={item.id}>{content}</div>;
            })}
          </div>
        )}
      </CardBody>
      {viewAllLink && items.length > 0 && (
        <div className="p-6 mt-auto border-t border-slate-50">
          <Link
            to={viewAllLink}
            className="flex items-center justify-center w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-brand-lighter hover:text-brand transition-all"
          >
            View All Activity
          </Link>
        </div>
      )}
    </Card>
  );
}
