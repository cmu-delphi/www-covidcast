import { timeFormat } from 'd3-time-format';
import { format } from 'd3-format';
import embed from 'vega-embed';
import { Error, expressionFunction } from 'vega';

const cache = new Map();

export function cachedTime(datum, params) {
  const key = `d:${params}`;
  if (cache.has(key)) {
    return cache.get(key)(datum);
  }
  const formatter = timeFormat(params);
  cache.set(key, formatter);
  return formatter(datum);
}

export function cachedNumber(datum, params) {
  const key = `n:${params}`;
  if (cache.has(key)) {
    return cache.get(key)(datum);
  }
  const formatter = format(params);
  cache.set(key, formatter);
  return formatter(datum);
}

expressionFunction('cachedTime', cachedTime);
expressionFunction('cachedNumber', cachedNumber);

/**
 * @param {string | HTMLElement} root
 * @param {import('vega-embed').VisualizationSpec | string} spec
 * @param {import('vega-embed').EmbedOptions} options
 * @return {Promise<import('vega-embed').Result>}
 */
export default function createVega(root, spec, options) {
  return embed(root, spec, {
    actions: false,
    logLevel: Error,
    ...options,
  });
}
