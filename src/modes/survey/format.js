import { format } from 'd3-format';
import { parseAPITime } from '../../data';
import { formatDateShort } from '../../formats';
import { factor } from './questions';

const f = format('.1f');

export function formatValue(value) {
  return value == null || Number.isNaN(value) ? 'N/A' : f(value * factor);
}

export function formatTrendChange(change) {
  if (change == null || Number.isNaN(change)) {
    return 'N/A';
  }
  return `${f(Math.abs(change) * 100)}%`;
}

export function formatTrend(change) {
  if (change == null || Number.isNaN(change)) {
    return 'N/A';
  }
  if (change === 0) {
    return 'No change';
  }
  if (change < 0) {
    return `Decreased ${formatTrendChange(change)}`;
  }
  return `Increased ${formatTrendChange(change)}`;
}
export function formatStdErr(stderr) {
  return `±${formatValue(stderr)}`;
}

export function formatSampleSize(entry) {
  if (!entry || entry.sample_size == null) {
    return 'N/A';
  }
  return Math.floor(entry.sample_size).toLocaleString();
}

export function formatIssueDate(entry) {
  if (!entry || entry.issue == null) {
    return 'N/A';
  }
  return formatDateShort(parseAPITime(entry.issue));
}
