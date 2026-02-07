import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all ${
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }: any) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all ${
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

export function Label({ children, className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider ${className}`} {...props}>
      {children}
    </label>
  );
}

export function FormGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}>{children}</div>;
}
