import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';

const f = format('.1f');
const d = timeFormat('%b %-d');

export function formatValue(value) {
  return value == null || Number.isNaN(value) ? '?' : f(value * 10);
}

export function formatDate(date) {
  return !date ? '?' : d(date);
}

export function formatDelta(delta) {
  return `${delta > 0 ? '+' : ''}${formatValue(delta)}`;
}
