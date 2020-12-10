import { format } from 'd3-format';
import { parseAPITime } from '../../data';
import { formatDateShort } from '../../formats';
import { factor } from './questions';

const f = format('.1f');

export function formatValue(value) {
  return value == null || Number.isNaN(value) ? 'N/A' : f(value * factor);
}

export function formatDelta(delta) {
  if (delta == null || Number.isNaN(delta)) {
    return 'N/A';
  }
  if (delta === 0) {
    return 'No change';
  }
  if (delta < 0) {
    return `Decreased ${formatValue(delta)}`;
  }
  return `Increased ${formatValue(delta)}`;
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
