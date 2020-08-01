import { L } from '../layers.js';

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
}
