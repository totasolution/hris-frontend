import { Link } from 'react-router-dom';
import { Card } from '../Card';

type QuickAction = {
  label: string;
  path: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  permission?: string;
};

type QuickActionsProps = {
  title?: string;
  actions: QuickAction[];
  userPermissions?: string[];
  className?: string;
};

export function QuickActions({
  title = 'Quick Actions',
  actions,
  userPermissions = [],
  className = '',
}: QuickActionsProps) {
  const visibleActions = actions.filter(
    (action) => !action.permission || userPermissions.includes(action.permission)
  );

  if (visibleActions.length === 0) return null;

  return (
    <Card className={`rounded-[2rem] p-8 border-slate-100 shadow-xl shadow-slate-200/50 ${className}`}>
      {title && <h3 className="text-lg font-bold text-brand-dark font-headline mb-6">{title}</h3>}
      <div className="flex flex-wrap gap-4">
        {visibleActions.map((action, idx) => {
          const isPrimary = action.variant === 'primary';
          return (
            <Link
              key={idx}
              to={action.path}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all active:scale-95 ${
                isPrimary
                  ? 'bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand-dark'
                  : 'bg-slate-50 text-slate-600 hover:bg-brand-lighter hover:text-brand'
              }`}
            >
              {action.icon && <span className="w-5 h-5">{action.icon}</span>}
              {action.label}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
