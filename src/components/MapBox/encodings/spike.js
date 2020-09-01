import { L, toFillLayer, toSpikeLayer } from '../layers';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';
import { SpikeLayer } from './SpikeLayer';
import { toCenterSource } from '../sources';

export default class SpikeEncoding {
  constructor(theme, levels) {
    this.id = 'spike';
    this.theme = theme;
    this.layers = levels.map((level) => toSpikeLayer(level));
    this.customLayers = new Map(levels.map((level) => [level, new SpikeLayer(toCenterSource(level), level)]));
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') {
      return [];
    }
    return [toFillLayer(level), L[level].spike];
  }

  /**
   *
   * @param {import('mapbox-gl').Map} map
   */
  addLayers(map, adapter) {
    adapter.levels.forEach((level) => {
      map.addLayer(this.customLayers.get(level).asLayer(L[level].spike));
    });
  }

  encode(map, level, _signalType, sensor, valueMinMax, _stops, _stopsMega, scale) {
    map.setPaintProperty(toFillLayer(level), 'fill-color', this.theme.countyFill);

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
