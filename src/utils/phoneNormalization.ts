export function normalizePhoneNumber(value: string): string {
  if (!value) return value;
  const trimmed = value.trim();
  if (trimmed.startsWith('0')) {
    return '+27' + trimmed.slice(1);
  }
  if (trimmed.startsWith(' ')) {
    return '+27' + trimmed.trimStart();
  }
  return trimmed;
}

export function formatPhoneOnChange(value: string, previousValue: string): string {
  if (!value) return value;
  if (value === '0' && previousValue !== '0') return '+27';
  if (value === ' 0' && previousValue !== ' 0') return '+27';
  if (value.startsWith('0') && (previousValue === '' || previousValue === '+27')) {
    return '+27' + value.slice(1);
  }
  return value;
}
