import { Link } from 'react-router-dom';
import { Card } from '../Card';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  link?: string;
  color?: 'brand' | 'blue' | 'green' | 'orange' | 'red' | 'gray';
  loading?: boolean;
  className?: string;
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  link,
  color = 'brand',
  loading = false,
  className = '',
}: StatCardProps) {
  const colorClasses = {
    brand: 'bg-brand-lighter text-brand',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-slate-100 text-slate-600',
  };

  const valueColorClasses = {
    brand: 'text-brand',
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    gray: 'text-slate-600',
  };

  const content = (
    <Card className={`rounded-[2rem] p-8 group hover:border-brand/20 transition-all border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden ${className}`}>
      {icon && (
        <div className={`h-12 w-12 rounded-2xl ${colorClasses[color]} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-brand-dark font-headline">{title}</h3>
      <div className="mt-6 flex items-baseline gap-2">
        <span className={`text-5xl font-black ${valueColorClasses[color]} tracking-tighter font-headline`}>
          {loading ? '...' : value}
        </span>
        {subtitle && (
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{subtitle}</span>
        )}
      </div>
      {link && (
        <Link to={link} className="mt-8 text-brand font-bold text-xs uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
          View Details <span>→</span>
        </Link>
      )}
    </Card>
  );

  return content;
}
