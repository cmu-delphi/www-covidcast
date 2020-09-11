import { toFillLayer, toBubbleLayer } from '../layers';
import { toCenterSource } from '../sources';
import { parseScaleSpec } from '../../../stores/scales';
import { BubbleLayer } from './BubbleLayer';

export default class BubbleEncoding {
  constructor(theme, levels) {
    this.id = 'bubble';
    this.theme = theme;
    this.layers = levels.map((level) => toBubbleLayer(level));
    this.customLayers = new Map(levels.map((level) => [level, new BubbleLayer(toCenterSource(level), level)]));
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') {
      return [];
    }
    return [toFillLayer(level), toBubbleLayer(level)];
  }

  /*
   * @param {number} zoom
   */
  onZoom(zoom) {
    this.customLayers.forEach((layer) => (layer.zoom = zoom));
  }

  /**
   *
   * @param {import('mapbox-gl').Map} map
   */
  addLayers(map, adapter) {
    adapter.levels.forEach((level) => {
      map.addLayer(this.customLayers.get(level).asLayer(toBubbleLayer(level)));
    });
  }

  encode(map, { level, sensorType, valueMinMax, scale }) {
    // constant background
    map.setPaintProperty(toFillLayer(level), 'fill-color', this.theme.countyFill);

    // color scale (color + stroke color)
    // const colorExpression = interpolateValue(stops);
    const minRadius = this.theme.minRadius[level];
    const maxRadius = this.theme.maxRadius[level];

    const radiusScaleTheme = this.theme.radiusScale[sensorType];

    const radiusScale = parseScaleSpec(radiusScaleTheme).domain(valueMinMax).range([minRadius, maxRadius]).clamp(true);

    this.customLayers.get(level).encode(radiusScale, scale);
    return radiusScale;
  }

  updateSources(map, level, lookup, primaryValue) {
    this.customLayers.get(level).updateSources(lookup, primaryValue);
  }
}
