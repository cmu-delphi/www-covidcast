import { timeFormat } from 'd3-time-format';

const short = timeFormat('%B %d');
const shortAbbr = timeFormat('%b %d');
const shortNumbers = timeFormat('%m/%d');
const iso = timeFormat('%Y-%m-%d');
const local = timeFormat('%m/%d/%Y');

export function formatDateShortNumbers(date) {
  return !date ? '?' : shortNumbers(date);
}

export function formatDateShort(date) {
  return !date ? '?' : short(date);
}

export function formatDateShortAbbr(date) {
  return !date ? '?' : shortAbbr(date);
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
