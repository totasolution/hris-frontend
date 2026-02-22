/**
 * Standard display format for gender everywhere: "Laki-laki" | "Perempuan".
 */
export function formatGender(gender: string | undefined | null): string {
  if (gender == null || gender === '') return '';
  const g = gender.toLowerCase();
  if (g === 'male') return 'Laki-laki';
  if (g === 'female') return 'Perempuan';
  return gender;
}

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' },
] as const;
