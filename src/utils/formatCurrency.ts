/**
 * Format a value as Indonesian Rupiah (e.g. Rp 1.234.567).
 * Accepts string (e.g. "5000000", "Rp 5.000.000") or number.
 */
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const str = typeof value === 'number' ? String(value) : String(value).trim();
  if (!str) return '—';
  const digits = str.replace(/[^\d]/g, '');
  if (!digits) return str;
  const num = parseInt(digits, 10);
  if (Number.isNaN(num)) return str;
  const formatted = num.toLocaleString('id-ID');
  return `Rp ${formatted}`;
}
