import { format } from 'd3-format';
import { parseAPITime } from '../../data';
import { formatDateShort } from '../../formats';

const f = format('.1f');

export function formatValue(value) {
  return value == null || Number.isNaN(value) ? '?' : f(value * 10);
}

export function formatDelta(delta) {
  return `${delta > 0 ? '+' : ''}${formatValue(delta)}`;
}
export function formatStdErr(stderr) {
  return `±${formatValue(stderr)}`;
}

export function formatSampleSize(entry) {
  if (!entry || entry.sample_size == null) {
    return '?';
  }
  return Math.floor(entry.sample_size).toLocaleString();
}

export function formatIssueDate(entry) {
  if (!entry || entry.issue == null) {
    return '?';
  }
  return formatDateShort(parseAPITime(entry.issue));
}
