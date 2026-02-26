import i18n from '../i18n';

/**
 * Format a date using the current i18n locale (en -> en-US, id -> id-ID).
 * Use for all user-visible dates so language switch also switches date format.
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  return d.toLocaleDateString(locale, options);
}

/**
 * Format date with long month (e.g. "8 February 2026" / "8 Februari 2026").
 */
export function formatDateLong(date: Date | string | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Indonesian weekday and month names for PKWT contract date format */
const ID_WEEKDAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const ID_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/**
 * Format date for PKWT contracts: "Kamis, 06 November 2025"
 */
export function formatContractDateIndonesian(date: Date | string | number): string {
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  return `${ID_WEEKDAYS[d.getDay()]}, ${day} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Add months to a date and return the result as a Date (for formatting).
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}
