import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../Card';

type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
};

type TableWidgetProps<T> = {
  title: string;
  subtitle?: string;
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  viewAllLink?: string;
  viewAllLabel?: string;
  getRowLink?: (item: T) => string;
  className?: string;
};

export function TableWidget<T extends { id: number }>({
  title,
  subtitle,
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  viewAllLink,
  viewAllLabel = 'View All',
  getRowLink,
  className = '',
}: TableWidgetProps<T>) {
  return (
    <Card className={`rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col ${className}`}>
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
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            {emptyIcon && (
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                {emptyIcon}
              </div>
            )}
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((item) => {
              const rowContent = (
                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                  {columns.map((col, idx) => {
                    const content = col.render
                      ? col.render(item)
                      : (item[col.key as keyof T] as React.ReactNode);
                    return (
                      <div key={idx} className={idx === 0 ? 'flex-1 min-w-0' : 'flex-shrink-0'}>
                        {typeof content === 'string' || typeof content === 'number' ? (
                          <p className="text-sm font-bold text-brand-dark truncate">{content}</p>
                        ) : (
                          content
                        )}
                      </div>
                    );
                  })}
                  {getRowLink && (
                    <span className="text-slate-300 group-hover:text-brand transition-colors">→</span>
                  )}
                </div>
              );

              if (getRowLink) {
                return (
                  <Link key={item.id} to={getRowLink(item)}>
                    {rowContent}
                  </Link>
                );
              }

              return <div key={item.id}>{rowContent}</div>;
            })}
          </div>
        )}
      </CardBody>
      {viewAllLink && data.length > 0 && (
        <div className="p-6 mt-auto border-t border-slate-50">
          <Link
            to={viewAllLink}
            className="flex items-center justify-center w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-brand-lighter hover:text-brand transition-all"
          >
            {viewAllLabel}
          </Link>
        </div>
      )}
    </Card>
  );
}
