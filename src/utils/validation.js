const BOARD_ROW_LENGTH = 10;
const BOARD_NAME_MAX_LENGTH = BOARD_ROW_LENGTH;
const SUPPORTED_NAME_PATTERN = /[^A-Z0-9:.\-?!]/g;
const DEFAULT_TIMEZONE = 'America/New_York';

export function getDefaultTimezone() {
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return resolved || DEFAULT_TIMEZONE;
}

export function sanitizeEventName(value = '') {
  return value
    .toUpperCase()
    .replace(SUPPORTED_NAME_PATTERN, '')
    .trim();
}

export function getEventNameValidation(value = '') {
  const uppercaseValue = value.toUpperCase();
  const unsupportedCharacters = Array.from(
    new Set((uppercaseValue.match(SUPPORTED_NAME_PATTERN) || []).filter(Boolean)),
  );
  const sanitizedName = sanitizeEventName(value);

  return {
    sanitizedName,
    unsupportedCharacters,
    characterCount: sanitizedName.length,
    isEmpty: sanitizedName.length === 0,
    tooLong: sanitizedName.length > BOARD_NAME_MAX_LENGTH,
    maxLength: BOARD_NAME_MAX_LENGTH,
  };
}

export function isValidDateString(value = '') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

export function normalizeMode(mode) {
  return mode === 'countup' ? 'countup' : 'countdown';
}

export function normalizeCountdownRecord(record) {
  const now = Date.now();

  return {
    name: sanitizeEventName(record?.name || ''),
    date: isValidDateString(record?.date || '') ? record.date : '',
    mode: normalizeMode(record?.mode),
    updatedAt:
      typeof record?.updatedAt === 'number' && Number.isFinite(record.updatedAt)
        ? record.updatedAt
        : now,
  };
}

export { BOARD_NAME_MAX_LENGTH, BOARD_ROW_LENGTH, DEFAULT_TIMEZONE };
