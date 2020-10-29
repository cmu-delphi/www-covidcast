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
