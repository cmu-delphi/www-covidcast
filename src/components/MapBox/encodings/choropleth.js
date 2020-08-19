import { L } from '../layers';
import { levelMegaCounty } from '../../../stores/constants';
import { MISSING_VALUE, caseMissing } from './utils';
import { MAP_THEME } from '../../../theme';

export default class ChoroplethEncoding {
  constructor() {
    this.id = 'color';
    this.layers = [L.state.fill, L.msa.fill, L.county.fill];
  }

  getVisibleLayers(level) {
    return [L[level].fill];
  }

  addSources() {
    // does nothing since all sources/layers required for choropleth already exist in the map
  }

  addLayers() {
    // does nothing since all sources/layers required for choropleth already exist in the map
  }

  encode(map, level, signalType, sensor, valueMinMax, stops, stopsMega) {
    // ['interpolate', ['linear'], ['to-number', ['feature-state', 'value'], 0], ...stops.flat()]
    map.setPaintProperty(
      L[level].fill,
      'fill-color',
      caseMissing(
        MAP_THEME.countyFill,
        // else interpolate
        ['interpolate', ['linear'], ['to-number', ['feature-state', 'value'], 0], ...stops.flat()],
      ),
    );

    if (stopsMega) {
      map.setPaintProperty(L[levelMegaCounty.id].fill, 'fill-color', [
        'case',
        // when missing
        ['==', ['to-number', ['feature-state', 'value'], MISSING_VALUE], MISSING_VALUE],
        MAP_THEME.countyFill,
        // else interpolate
        ['interpolate', ['linear'], ['to-number', ['feature-state', 'value'], 0], ...stopsMega.flat()],
      ]);
    }
  }

  updateSources() {
    // dummy
  }
}
