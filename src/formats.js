import { timeFormat } from 'd3-time-format';

const short = timeFormat('%B %d');
const shortNumbers = timeFormat('%m/%d');
const iso = timeFormat('%Y-%m-%d');
const local = timeFormat('%x');

export function formatDateShortNumbers(date) {
  return !date ? '?' : shortNumbers(date);
}

export function formatDateShort(date) {
  return !date ? '?' : short(date);
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
export function formatArea(info) {
  if (!info || typeof info.area !== 'number') {
    return 'Unknown';
  }
  return info.area.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
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
