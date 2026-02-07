import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/10 active:scale-95 border-transparent',
  secondary:
    'bg-brand-dark text-white hover:bg-black shadow-lg shadow-brand-dark/10 active:scale-95 border-transparent',
  ghost:
    'bg-transparent text-slate-600 hover:bg-brand-lighter hover:text-brand active:scale-95 border-transparent',
  danger:
    'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-95 border-transparent',
  outline:
    'bg-transparent text-slate-700 hover:bg-slate-50 border-slate-300 active:scale-95',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant ?? 'primary']} ${className}`.trim()}
      {...props}
    />
  );
}

export function ButtonLink({
  to,
  variant = 'primary',
  className = '',
  children,
  ...props
}: { to: string; variant?: Variant; children: React.ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>) {
  return (
    <Link
      to={to}
      className={`${baseClasses} ${variantClasses[variant ?? 'primary']} ${className}`.trim()}
      {...props}
    >
      {children}
    </Link>
  );
}
