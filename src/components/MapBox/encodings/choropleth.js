import { L } from '../layers';

export default class ChoroplethEncoding {
  constructor() {
    this.layers = [L.state.fill, L.msa.fill, L.county.fill];
  }

  getVisibleLayers(level) {
    return [L[level].fill];
  }

  addSources() {
    // does nothing since all sources/layers required for cholopleth already exist in the map
  }

  addLayers() {
    // does nothing since all sources/layers required for cholopleth already exist in the map
  }

  encode(map, level, signalType, sensor, valueMinMax, stops, stopsMega) {
    map.setPaintProperty(L[level].fill, 'fill-color', {
      property: signalType,
      stops: stops,
    });

    if (stopsMega) {
      map.setPaintProperty(L['mega-county'].fill, 'fill-color', {
        property: signalType,
        stops: stopsMega,
      });
    }
  }
}
