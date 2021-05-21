import { timeFormat } from 'd3-time-format';
import { format } from 'd3-format';

const short = timeFormat('%B %d');
const shortAbbr = timeFormat('%b %d');
const shortNumbers = timeFormat('%-m/%d');
const iso = timeFormat('%Y-%m-%d');
const local = timeFormat('%m/%d/%Y');
const shortAbbrNth = timeFormat('%b %-d');
const shortWeekdayAbbr = timeFormat('%a, %b %-d');
const weekday = timeFormat('%A, %B %-d');

export function formatDateShortNumbers(date?: Date): string {
  return !date ? '?' : shortNumbers(date);
}

export function formatDateShort(date?: Date): string {
  return !date ? '?' : short(date);
}

export function formatDateShortAbbr(date?: Date): string {
  return !date ? '?' : shortAbbr(date);
}

export function formatDateShortWeekdayAbbr(date?: Date, nthSuffix = false): string {
  return !date ? '?' : shortWeekdayAbbr(date) + (nthSuffix ? nth(date.getDate()) : '');
}

export function formatDateWeekday(date?: Date, nthSuffix = false): string {
  return !date ? '?' : weekday(date) + (nthSuffix ? nth(date.getDate()) : '');
}

export function formatDateYearWeekdayAbbr(date?: Date, nthSuffix = false): string {
  return !date ? '?' : formatDateShortWeekdayAbbr(date, nthSuffix) + ` ${date.getFullYear()}`;
}

function nth(d: number) {
  // based on https://stackoverflow.com/questions/15397372/javascript-new-date-ordinal-st-nd-rd-th
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function formatDateShortOrdinal(date?: Date, nthSuffix = true): string {
  return !date ? '?' : shortAbbrNth(date) + (nthSuffix ? nth(date.getDate()) : '');
}

export function formatDateISO(date?: Date): string {
  return !date ? '?' : iso(date);
}

export function formatDateLocal(date?: Date): string {
  return !date ? '?' : local(date);
}

export function formatPopulation(info: { population?: number }): string {
  if (!info || typeof info.population !== 'number') {
    return 'Unknown';
  }
  return info.population.toLocaleString();
}

const f = format(',.1f');
const count = format('~s');
const basePercentFormatter = format('.2%');
const rawFormatter = format(',.2f');

function sign(
  value: number | null | undefined,
  formatter: (v: number) => string,
  enforceSign: boolean,
  factor = 1,
): string {
  if (value == null || Number.isNaN(value)) {
    return 'N/A';
  }
  const v = formatter(value * factor);
  if (!enforceSign || v.startsWith('-') || v.startsWith('−')) {
    return v;
  }
  if (v === formatter(0)) {
    return `±${v}`;
  }
  return `+${v}`;
}

export function formatValue(value?: number | null, enforceSign = false): string {
  return sign(value, f, enforceSign);
}
export function formatCount(value?: number | null, enforceSign = false): string {
  return sign(value, count, enforceSign);
}
export function formatPercentage(value?: number | null, enforceSign = false): string {
  return sign(value, basePercentFormatter, enforceSign, 1 / 100);
}
export function formatFraction(value?: number | null, enforceSign = false): string {
  return sign(value, basePercentFormatter, enforceSign);
}
export function formatRawValue(value?: number | null, enforceSign = false): string {
  return sign(value, rawFormatter, enforceSign);
}

export const formatter = {
  raw: formatRawValue,
  raw_count: formatCount,
  fraction: formatRawValue,
  percent: formatPercentage,
  per100k: formatValue,
};
export const formatSpecifiers = {
  raw: ',.2f',
  raw_count: '~s',
  fraction: ',.2f',
  percent: '.2f',
  per100k: ',.1f',
};
