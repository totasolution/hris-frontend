import { useTranslation } from 'react-i18next';

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  /** Accepted for backwards-compat with existing callers; no longer rendered. */
  perPage?: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  const { t } = useTranslation('common');
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-center px-4 py-3 border-t border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('previous')}
        </button>
        <span className="text-sm text-slate-600">
          {t('pageOf', { page, totalPages })}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}
