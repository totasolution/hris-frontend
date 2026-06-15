import { useTranslation } from 'react-i18next';

const DEFAULT_PER_PAGE_OPTIONS = [10, 25, 50, 100];

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  perPage?: number;
  /** Override the default [10, 25, 50, 100] options. */
  perPageOptions?: number[];
  /** When provided, renders a rows-per-page selector. */
  onPerPageChange?: (perPage: number) => void;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  totalPages,
  total,
  perPage,
  perPageOptions,
  onPerPageChange,
  onPageChange,
}: PaginationProps) {
  const { t } = useTranslation('common');
  if (total === 0) return null;
  const showPerPage = !!onPerPageChange;
  // Ensure the current page size is selectable even if it isn't a default option.
  const baseOptions = perPageOptions ?? DEFAULT_PER_PAGE_OPTIONS;
  const options = perPage != null && !baseOptions.includes(perPage)
    ? [...baseOptions, perPage].sort((a, b) => a - b)
    : baseOptions;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
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
      {showPerPage && (
        <select
          value={perPage}
          onChange={(e) => onPerPageChange!(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        >
          {options.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      )}
    </div>
  );
}
