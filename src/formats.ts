import { timeFormat } from 'd3-time-format';
import { format } from 'd3-format';
import { EpiWeek } from './data/EpiWeek';

const short = timeFormat('%B %d');
const shortAbbr = timeFormat('%b %d');
const shortNumbers = timeFormat('%-m/%d');
const iso = timeFormat('%Y-%m-%d');
const local = timeFormat('%m/%d/%Y');
const shortAbbrNth = timeFormat('%b %-d');
const shortDayOfWeekAbbr = timeFormat('%a, %b %-d');
const dayOfWeek = timeFormat('%A, %B %-d');

export function formatDateShortNumbers(date?: Date): string {
  return !date ? '?' : shortNumbers(date);
}

export function formatDateShort(date?: Date): string {
  return !date ? '?' : short(date);
}

export function formatDateShortAbbr(date?: Date): string {
  return !date ? '?' : shortAbbr(date);
}

export function formatDateShortDayOfWeekAbbr(date?: Date, nthSuffix = false): string {
  return !date ? '?' : shortDayOfWeekAbbr(date) + (nthSuffix ? nth(date.getDate()) : '');
}

export function formatDateDayOfWeek(date?: Date, nthSuffix = false): string {
  return !date ? '?' : dayOfWeek(date) + (nthSuffix ? nth(date.getDate()) : '');
}

export function formatDateYearDayOfWeekAbbr(date?: Date, nthSuffix = false): string {
  return !date ? '?' : formatDateShortDayOfWeekAbbr(date, nthSuffix) + ` ${date.getFullYear()}`;
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

export function formatWeek(date?: Date | EpiWeek): string {
  return !date ? '?' : date instanceof Date ? EpiWeek.fromDate(date).toString() : date.toString();
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

export const formatSpecifiers = {
  raw: ',.2f',
  raw_count: '~s',
  count: '~s',
  fraction: ',.2f',
  percent: '.2f',
  per100k: ',.1f',
};

const generic = format(',.1f');
const fractionAsPercentFormatter = format('.2%');
const rawFormatter = format(',.2f');

export function sign(
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
  return sign(value, generic, enforceSign);
}
export function formatFraction(value?: number | null, enforceSign = false): string {
  return sign(value, fractionAsPercentFormatter, enforceSign);
}
export function formatRawValue(value?: number | null, enforceSign = false): string {
  return sign(value, rawFormatter, enforceSign);
}

const count = format(formatSpecifiers.count);
const per100Formatter = format(formatSpecifiers.percent);

function formatCount(value?: number | null, enforceSign = false): string {
  return sign(value, count, enforceSign);
}
function formatPer100(value?: number | null, enforceSign = false): string {
  return sign(value, per100Formatter, enforceSign);
}

export const formatter = {
  raw: formatRawValue,
  raw_count: formatCount,
  count: formatCount,
  fraction: formatRawValue,
  percent: formatPer100,
  per100k: formatValue,
};
