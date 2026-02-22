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

/**
 * Add months to a date and return the result as a Date (for formatting).
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}
