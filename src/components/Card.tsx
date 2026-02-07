import type { HTMLAttributes } from 'react';

export function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-bento border border-slate-100 bg-white shadow-bento transition-all hover:shadow-card-hover ${className}`.trim()}
      {...props}
    />
  );
}

export function CardHeader({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-8 py-6 border-b border-slate-50 ${className}`.trim()} {...props} />;
}

export function CardBody({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-8 ${className}`.trim()} {...props} />;
}
