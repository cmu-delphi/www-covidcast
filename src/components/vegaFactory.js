import { timeFormat } from 'd3-time-format';
import { format } from 'd3-format';
import embed from 'vega-embed';
import { Error, expressionFunction, projection } from 'vega';
import { geoAlbersUsaTerritories } from 'geo-albers-usa-territories';
import { fitExtent, fitSize, fitWidth, fitHeight } from 'd3-geo/src/projection/fit.js';
import { timeDay } from 'd3-time';

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

expressionFunction('customInFilter', (arr, prop, values) => arr.filter((d) => values.includes(d[prop])));

expressionFunction('customCountDays', (d1, d2) => timeDay.count(d1, d2));
