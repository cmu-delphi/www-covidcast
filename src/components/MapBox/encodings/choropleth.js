import { toBorderLayer, toFillLayer } from '../layers';
import { levelMegaCounty } from '../../../stores/constants';
import { interpolateValue } from './utils';

export default class ChoroplethEncoding {
  constructor() {
    this.id = 'color';
    this.layers = [];
  }

  getVisibleLayers(level) {
    return [
      toFillLayer(level),
      level === 'county' && toFillLayer(levelMegaCounty.id),
      level === 'county' && toBorderLayer('state'),
    ].filter(Boolean);
  }

  addLayers() {
    // does nothing since all sources/layers required for choropleth already exist in the map
  }

  encode(map, { level, stops, stopsMega }) {
    map.setPaintProperty(toFillLayer(level), 'fill-color', interpolateValue(stops));

    if (stopsMega) {
      map.setPaintProperty(toFillLayer(levelMegaCounty.id), 'fill-color', interpolateValue(stopsMega));
    }
  }

  updateSources() {
    // dummy
  }
}
