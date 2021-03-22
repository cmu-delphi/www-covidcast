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

/**
 * @param {Date | null} date
 */
export function formatDateShortNumbers(date) {
  return !date ? '?' : shortNumbers(date);
}

/**
 * @param {Date | null} date
 */
export function formatDateShort(date) {
  return !date ? '?' : short(date);
}

/**
 * @param {Date | null} date
 */
export function formatDateShortAbbr(date) {
  return !date ? '?' : shortAbbr(date);
}

/**
 * @param {Date | null} date
 * @param {boolean} nthSuffix
 */
export function formatDateShortWeekdayAbbr(date, nthSuffix = false) {
  return !date ? '?' : shortWeekdayAbbr(date) + (nthSuffix ? nth(date.getDate()) : '');
}
/**
 * @param {Date | null} date
 * @param {boolean} nthSuffix
 */
export function formatDateWeekday(date, nthSuffix = false) {
  return !date ? '?' : weekday(date) + (nthSuffix ? nth(date.getDate()) : '');
}
/**
 * @param {Date | null} date
 * @param {boolean} nthSuffix
 */
export function formatDateYearWeekdayAbbr(date, nthSuffix = false) {
  return !date ? '?' : formatDateShortWeekdayAbbr(date, nthSuffix) + ` ${date.getFullYear()}`;
}

/**
 * @param {number} d
 */
function nth(d) {
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

/**
 * @param {Date | null} date
 * @param {boolean} nthSuffix
 */
export function formatDateShortOrdinal(date, nthSuffix = true) {
  return !date ? '?' : shortAbbrNth(date) + (nthSuffix ? nth(date.getDate()) : '');
}

/**
 * @param {Date | null} date
 */
export function formatDateISO(date) {
  return !date ? '?' : iso(date);
}

/**
 * @param {Date | null} date
 */
export function formatDateLocal(date) {
  return !date ? '?' : local(date);
}

/**
 * @param {NameInfo} info
 */
export function formatPopulation(info) {
  if (!info || typeof info.population !== 'number') {
    return 'Unknown';
  }
  return info.population.toLocaleString();
}

const f = format(',.1f');
const basePercentFormatter = format('.2%');
const rawFormatter = format(',.2f');

/**
 * @param {number} value
 * @param {(v: number) => number} formatter
 * @param {boolean} enforceSign
 * @param {number} factor
 */
function sign(value, formatter, enforceSign, factor = 1) {
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

/**
 * @param {number} value
 * @param {boolean} enforceSign
 */
export function formatValue(value, enforceSign = false) {
  return sign(value, f, enforceSign);
}
/**
 * @param {number} value
 * @param {boolean} enforceSign
 */
export function formatPercentage(value, enforceSign = false) {
  return sign(value, basePercentFormatter, enforceSign, 1 / 100);
}
/**
 * @param {number} value
 * @param {boolean} enforceSign
 */
export function formatFraction(value, enforceSign = false) {
  return sign(value, basePercentFormatter, enforceSign);
}
/**
 * @param {number} value
 * @param {boolean} enforceSign
 */
export function formatRawValue(value, enforceSign = false) {
  return sign(value, rawFormatter, enforceSign);
}
