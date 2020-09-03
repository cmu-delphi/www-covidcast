import { L } from '../layers';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';
import { SpikeLayer } from './SpikeLayer';
import { levels } from '../../../stores';
import { S } from '../sources';

export default class SpikeEncoding {
  constructor(theme) {
    this.id = 'spike';
    this.theme = theme;
    this.layers = levels.map((level) => L[level].spike);
    this.customLayers = new Map(levels.map((level) => [level, new SpikeLayer(S[level].center, level)]));
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') {
      return [];
    }
    return [L[level].fill, L[level].spike];
  }

  /**
   * @param {number} zoom
   */
  onZoom(zoom) {
    this.customLayers.forEach((layer) => (layer.zoom = zoom));
  }

  /**
   *
   * @param {import('mapbox-gl').Map} map
   */
  addLayers(map) {
    levels.forEach((level) => {
      map.addLayer(this.customLayers.get(level).asLayer(L[level].spike));
    });
  }

  encode(map, level, _signalType, sensor, valueMinMax, _stops, _stopsMega, scale) {
    map.setPaintProperty(L[level].fill, 'fill-color', this.theme.countyFill);

    const valueMax = valueMinMax[1];
    const maxHeight = this.theme.maxHeight[level];

    const heightScaleTheme = this.theme.heightScale[getType(sensor)];

    const heightScale = parseScaleSpec(heightScaleTheme).range([0, maxHeight]).domain([0, valueMax]).clamp(true);
    this.customLayers.get(level).encode(heightScale, scale);

    return heightScale;
  }

  updateSources(map, level, lookup, primaryValue) {
    this.customLayers.get(level).updateSources(lookup, primaryValue);
  }
}
