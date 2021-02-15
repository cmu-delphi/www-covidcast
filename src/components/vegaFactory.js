import { timeFormat } from 'd3-time-format';
import { format } from 'd3-format';
import embed from 'vega-embed';
import { Error, expressionFunction, projection } from 'vega';
import { geoAlbersUsaTerritories } from 'geo-albers-usa-territories';
import { fitExtent, fitSize, fitWidth, fitHeight } from 'd3-geo/src/projection/fit.js';

function patchedAlbersUsaTerritories() {
  // see https://github.com/stamen/geo-albers-usa-territories/pull/8/files
  const r = geoAlbersUsaTerritories();
  r.fitExtent = function (extent, object) {
    return fitExtent(r, extent, object);
  };

  r.fitSize = function (size, object) {
    return fitSize(r, size, object);
  };

  r.fitWidth = function (width, object) {
    return fitWidth(r, width, object);
  };

  r.fitHeight = function (height, object) {
    return fitHeight(r, height, object);
  };
  return r;
}

projection('albersUsaTerritories', patchedAlbersUsaTerritories);

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
  return array.map((d) => (d != null ? d[field] : null));
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
      range: 0,
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
    min,
    max,
    range: max - min,
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
      case '==':
        return v == value;
      case '<':
        return v < value;
      case '>':
        return v > value;
      case '>=':
        return v >= value;
      case '<=':
        return v <= value;
      default:
        return v === value;
    }
  });
}

expressionFunction('customObjChecks', customObjChecks);

/**
 * patches the given event and updates the picked item if needed
 * @param {MouseEvent} event
 */
function patchPickedItem(event) {
  if (event.type === 'touchmove' || event.type === 'touchend') {
    // manually resolve, see https://github.com/vega/vega/issues/3065
    event.item = event.vega.view()._handler.pickEvent(event.changedTouches[0]);
    event.vega.item = () => event.item;
  }
  return event.item;
}
expressionFunction('patchPickedItem', patchPickedItem);

/**
 * computes padding such that the chart are is centered and squared for the given parameters
 * @param {[number, number]} container size
 * @param {any[]} x scale domain
 * @param {any[]} domainY
 * @param {{left: number, top: number, right: number, bottom: number}} basePadding
 * @param {number} paddingXOuter
 * @param {number} paddingYOuter
 * @param {number} factorX
 * @param {number} factorY
 */
function paddingSquareCenter(
  [width, height],
  domainX,
  domainY,
  basePadding,
  paddingXOuter,
  paddingYOuter,
  factorX,
  factorY,
) {
  const wBase = width - basePadding.left - basePadding.right;
  const hBase = height - basePadding.top - basePadding.bottom;
  const domainXW = domainX.length + paddingXOuter * 2;
  const domainYW = domainY.length + paddingYOuter * 2;
  const stepX = wBase / domainXW / factorX;
  const stepY = hBase / domainYW / factorY;
  const step = Math.min(stepX, stepY);
  const wPadded = domainXW * step * factorX;
  const hPadded = domainYW * step * factorY;

  return {
    left: basePadding.left + (wBase - wPadded) / 2,
    right: basePadding.right + (wBase - wPadded) / 2,
    top: basePadding.top + (hBase - hPadded) / 2,
    bottom: basePadding.bottom + (hBase - hPadded) / 2,
  };
}
expressionFunction('paddingSquareCenter', paddingSquareCenter);
