import { timeFormat } from 'd3-time-format';
import { format } from 'd3-format';

const short = timeFormat('%B %d');
const shortAbbr = timeFormat('%b %d');
const shortNumbers = timeFormat('%-m/%d');
const iso = timeFormat('%Y-%m-%d');
const local = timeFormat('%m/%d/%Y');
const shortAbbrNth = timeFormat('%b %-d');
const shortWeekdayAbbr = timeFormat('%a %b %-d');

export function formatDateShortNumbers(date) {
  return !date ? '?' : shortNumbers(date);
}

export function formatDateShort(date) {
  return !date ? '?' : short(date);
}

export function formatDateShortAbbr(date) {
  return !date ? '?' : shortAbbr(date);
}

export function formatDateShortWeekdayAbbr(date) {
  return !date ? '?' : shortWeekdayAbbr(date);
}

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
 * @param {Date} date
 */
export function formatDateShortOrdinal(date, suffix = true) {
  return !date ? '?' : shortAbbrNth(date) + (suffix ? nth(date.getDate()) : '');
}

export function formatDateISO(date) {
  return !date ? '?' : iso(date);
}

export function formatDateLocal(date) {
  return !date ? '?' : local(date);
}

/**
 *
 * @param {NameInfo} info
 */
export function formatPopulation(info) {
  if (!info || typeof info.population !== 'number') {
    return 'Unknown';
  }
  return info.population.toLocaleString();
}

const f = format('.1f');
const formatP = format('.1p');

export function formatValue(value) {
  return value == null || Number.isNaN(value) ? 'N/A' : f(value);
}

export function formatPercentage(value) {
  return value == null || Number.isNaN(value) ? 'N/A' : formatP(value);
}
