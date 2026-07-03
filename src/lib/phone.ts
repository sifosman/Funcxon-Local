/**
 * South African phone normalisation helpers.
 * Defaults to the +27 country code and strips a leading 0.
 */

const DEFAULT_COUNTRY_CODE = '27';

export function normalizePhone(input: string | null | undefined): string {
  if (!input) return '';

  let digits = input.replace(/\s+/g, '').replace(/[^+\d]/g, '');

  if (digits.startsWith('++')) {
    digits = digits.slice(1);
  }

  if (digits.startsWith('+')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return `+${DEFAULT_COUNTRY_CODE}${digits}`;
}

export function formatPhoneForDisplay(input: string | null | undefined): string {
  if (!input) return '';
  const normalized = normalizePhone(input);
  // +27 XX XXX XXXX → +27 12 345 6789
  return normalized.replace(
    /^(\+27)(\d{2})(\d{3})(\d{4})$/,
    '$1 $2 $3 $4'
  );
}

export function isValidPhone(input: string | null | undefined): boolean {
  if (!input) return false;
  const normalized = normalizePhone(input);
  return /^\+27\d{9}$/.test(normalized);
}

export function handlePhoneInputChange(
  value: string,
  onChange: (normalized: string) => void
): void {
  const normalized = normalizePhone(value);
  onChange(normalized);
}
