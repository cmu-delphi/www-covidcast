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

/**
 * 
 * @param {any[]} array 
 * @param {string} field 
 */
function customMap(array, field) {
  return array.map((d) => d != null ? d[field] : null);
}

/**
 * 
 * @param {any[]} array 
 * @param {string} field 
 */
function customFilter(array, field, value) {
  return array.filter((d) => d != null && d[field] === value);
}

/**
 * 
 * @param {any[]} array 
 * @param {string} field 
 */
function customReduce(array, field, reduceFunction, initialValue) {
  return array.reduce((acc, d) => reduceFunction(acc, d != null ? d[field] : null), initialValue);
}

expressionFunction('customMap', customMap);
expressionFunction('customFilter', customFilter);
expressionFunction('customReduce', customReduce);

function customExtent(arr, field) {
  if (arr.length === 0) {
    return {
      min: null,
      max: null,
      range: 0
    };
  }
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const d of arr) {
    const v = d != null ? d[field] : null;
    if (v != null) {
      min = Math.min(min, +v);
      max = Math.max(max, +v);
    }
  }

  return {
    min, max, range: max - min,
  };
}
expressionFunction('customExtent', customExtent);

function customObjChecks(obj, ...conditions) {
  if (conditions.length === 0) {
    return true;
  }
  return conditions.every(([field, op, value]) => {
    const v = obj != null ? obj[field] : null;
    switch (op) {
      case '==': return v == value;
      case '<': return v < value;
      case '>': return v > value;
      case '>=': return v >= value;
      case '<=': return v <= value;
      default:
        return v === value;
    }
  });
}

expressionFunction('customObjChecks', customObjChecks);