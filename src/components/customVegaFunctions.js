import { timeFormat } from 'd3-time-format';

const cache = new Map();

export function cachedTime(datum, params) {
  if (cache.has(params)) {
    return cache.get(params)(datum);
  }
  const formatter = timeFormat(params);
  cache.set(params, formatter);
  return formatter(datum);
}
