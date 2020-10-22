import { toFillLayer } from '../layers';
import { levelMegaCounty } from '../../../stores/constants';
import { interpolateValue } from './utils';

export default class ChoroplethEncoding {
  constructor() {
    this.id = 'color';
    this.layers = [];
  }

  getVisibleLayers(level) {
    return [toFillLayer(level), level === 'county' && toFillLayer(levelMegaCounty.id)].filter(Boolean);
  }

  addLayers() {
    // does nothing since all sources/layers required for choropleth already exist in the map
  }

  encode(map, { level, stops, stopsMega, sensorEntry }) {
    map.setPaintProperty(toFillLayer(level), 'fill-color', interpolateValue(stops, sensorEntry));

    if (stopsMega) {
      map.setPaintProperty(toFillLayer(levelMegaCounty.id), 'fill-color', interpolateValue(stopsMega, sensorEntry));
    }
  }

  updateSources() {
    // dummy
  }
}
