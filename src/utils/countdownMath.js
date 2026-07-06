import {
  getDefaultTimezone,
  isValidDateString,
  normalizeMode,
} from './validation';

const BOARD_COUNT_VALUE_MAX = 99_999_999;

function parseDateString(dateString) {
  if (!isValidDateString(dateString)) {
    return null;
  }

  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function toEpochDay(year, month, day) {
  const adjustedYear = month <= 2 ? year - 1 : year;
  const era = Math.floor(adjustedYear / 400);
  const yearOfEra = adjustedYear - era * 400;
  const monthIndex = month > 2 ? month - 3 : month + 9;
  const dayOfYear = Math.floor((153 * monthIndex + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 +
    Math.floor(yearOfEra / 4) -
    Math.floor(yearOfEra / 100) +
    dayOfYear;

  return era * 146097 + dayOfEra - 719468;
}

export function getTodayStringInTimezone(timezone, referenceDate = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || getDefaultTimezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(referenceDate);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

export function getDayDifference(dateString, referenceDate = new Date()) {
  const targetParts = parseDateString(dateString);
  const todayParts = parseDateString(
    getTodayStringInTimezone(getDefaultTimezone(), referenceDate),
  );

  if (!targetParts || !todayParts) {
    return null;
  }

  const targetDay = toEpochDay(
    targetParts.year,
    targetParts.month,
    targetParts.day,
  );
  const todayDay = toEpochDay(todayParts.year, todayParts.month, todayParts.day);

  return targetDay - todayDay;
}

export function buildBoardState(countdown, referenceDate = new Date()) {
  const timezone = getDefaultTimezone();
  const mode = normalizeMode(countdown?.mode);
  const difference = getDayDifference(countdown?.date, referenceDate);

  if (difference === null) {
    return {
      prefix: 'D',
      sign: '-',
      value: 0,
      label: 'D minus 0',
      direction: 'countdown',
      isFutureCountup: false,
      isOverLimit: false,
      todayString: getTodayStringInTimezone(timezone, referenceDate),
    };
  }

  if (mode === 'countup') {
    const elapsed = difference * -1;
    const sign = elapsed >= 0 ? '+' : '-';
    const value = Math.abs(elapsed);

    return {
      prefix: 'D',
      sign,
      value,
      label: `D ${sign === '+' ? 'plus' : 'minus'} ${value}`,
      direction: 'countup',
      isFutureCountup: sign === '-',
      isOverLimit: value > BOARD_COUNT_VALUE_MAX,
      todayString: getTodayStringInTimezone(timezone, referenceDate),
    };
  }

  const sign = difference >= 0 ? '-' : '+';
  const value = Math.abs(difference);

  return {
    prefix: 'D',
    sign,
    value,
    label: `D ${sign === '+' ? 'plus' : 'minus'} ${value}`,
    direction: 'countdown',
    isFutureCountup: false,
    isOverLimit: value > BOARD_COUNT_VALUE_MAX,
    todayString: getTodayStringInTimezone(timezone, referenceDate),
  };
}

export { BOARD_COUNT_VALUE_MAX };
