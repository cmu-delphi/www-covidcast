import { toFillLayer, toSpikeLayer } from '../layers';
import { parseScaleSpec } from '../../../stores/scales';
import { SpikeLayer } from './SpikeLayer';
import { toCenterSource } from '../sources';

const MAX_ZOOMED_HEIGHT = 100;

export default class SpikeEncoding {
  constructor(theme, levels) {
    this.id = 'spike';
    this.theme = theme;
    this.layers = levels.map((level) => toSpikeLayer(level));
    this.customLayers = new Map(levels.map((level) => [level, new SpikeLayer(toCenterSource(level), level)]));
  }

  getVisibleLayers(level) {
    return [toFillLayer(level), toSpikeLayer(level)];
  }

  /**
   * @param {number} zoom
   */
  onZoom(zoom) {
    this.customLayers.forEach((layer) => (layer.zoom = zoom));
  }

  getMaxZoom(level) {
    const maxHeight = this.theme.maxHeight[level];
    return MAX_ZOOMED_HEIGHT / maxHeight;
  }

  /**
   *
   * @param {import('mapbox-gl').Map} map
   */
  addLayers(map, adapter) {
    adapter.levels.forEach((level) => {
      map.addLayer(this.customLayers.get(level).asLayer(toSpikeLayer(level)));
    });
  }

  encode(map, { level, sensorType, valueMinMax, scale }) {
    map.setPaintProperty(toFillLayer(level), 'fill-color', this.theme.countyFill);

    const valueMax = valueMinMax[1];
    const maxHeight = this.theme.maxHeight[level];

    const heightScaleTheme = this.theme.heightScale[sensorType];

    const heightScale = parseScaleSpec(heightScaleTheme).range([0, maxHeight]).domain([0, valueMax]).clamp(true);
    this.customLayers.get(level).encode(heightScale, scale);

    return heightScale;
  }

  updateSources(map, level, lookup, primaryValue) {
    this.customLayers.get(level).updateSources(lookup, primaryValue);
  }
}
