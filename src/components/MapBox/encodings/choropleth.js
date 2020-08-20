import { L } from '../layers';
import { levelMegaCounty, levels } from '../../../stores/constants';
import { interpolateValue } from './utils';

export default class ChoroplethEncoding {
  constructor() {
    this.id = 'color';
    this.layers = levels.map((level) => L[level].fill);
    this.interactiveSources = [];
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
    map.setPaintProperty(L[level].fill, 'fill-color', interpolateValue(stops));

    if (stopsMega) {
      map.setPaintProperty(L[levelMegaCounty.id].fill, 'fill-color', interpolateValue(stopsMega));
    }
  }

  updateSources() {
    // dummy
  }
}
