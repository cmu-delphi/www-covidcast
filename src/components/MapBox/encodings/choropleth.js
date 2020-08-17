import { L, toFillLayer } from '../layers';
import { levelMegaCounty } from '../../../stores/constants';

export default class ChoroplethEncoding {
  constructor() {
    this.id = 'color';
    this.layers = [];
    this.sources = [];
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
    map.setPaintProperty(toFillLayer(level), 'fill-color', {
      property: signalType,
      stops: stops,
    });

    if (stopsMega) {
      map.setPaintProperty(toFillLayer(levelMegaCounty.id), 'fill-color', {
        property: signalType,
        stops: stopsMega,
      });
      map.setLayoutProperty(toFillLayer(levelMegaCounty.id), 'visibility', 'visible');
    }
  }

  updateSources() {
    // dummy
  }
}
