import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-500 font-medium uppercase tracking-widest">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
