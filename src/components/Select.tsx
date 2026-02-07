import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function Select({ label, error, className = '', children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all ${
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
