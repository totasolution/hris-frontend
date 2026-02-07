type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, total, perPage, onPageChange }: PaginationProps) {
  if (totalPages <= 1 && total <= perPage) return null;
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
      <p className="text-sm text-slate-600">
        Showing <span className="font-medium">{start}</span> to <span className="font-medium">{end}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
