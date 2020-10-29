import { format } from 'd3-format';

const f = format('.1f');

export function formatValue(value) {
  return value == null || Number.isNaN(value) ? '?' : f(value * 10);
}

export function formatDelta(delta) {
  return `${delta > 0 ? '+' : ''}${formatValue(delta)}`;
}
