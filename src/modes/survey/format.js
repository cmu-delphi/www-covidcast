import { parseAPITime } from '../../data';
import { formatDateShort, formatValue } from '../../formats';

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
