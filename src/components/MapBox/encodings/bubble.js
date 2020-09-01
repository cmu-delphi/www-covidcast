import { toFillLayer, toBubbleLayer } from '../layers';
import { toCenterSource } from '../sources';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';
import { caseMissing, interpolateValue } from './utils';

export default class BubbleEncoding {
  constructor(theme, levels) {
    this.id = 'bubble';
    this.theme = theme;
    this.layers = levels.map((level) => toBubbleLayer(level));
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') {
      return [];
    }
    return [toFillLayer(level), toBubbleLayer(level)];
  }

  addLayers(map, adapter) {
    adapter.levels.forEach((level) => {
      map.addLayer({
        id: toBubbleLayer(level),
        source: toCenterSource(level),
        type: 'circle',
        layout: {
          visibility: 'none',
        },
        paint: {
          'circle-radius': 0,
          'circle-color': this.theme.color,
          'circle-stroke-color': this.theme.strokeColor,
          'circle-stroke-width': this.theme.strokeWidth,
          'circle-opacity': caseMissing(0, this.theme.opacity),
          'circle-stroke-opacity': caseMissing(0, this.theme.strokeOpacity),
          ...adapter.animationOptions('circle-radius'),
        },
      });
    });
  }

  encode(map, level, signalType, sensor, valueMinMax, stops) {
    // constant background
    map.setPaintProperty(toFillLayer(level), 'fill-color', this.theme.countyFill);

    // color scale (color + stroke color)
    const colorExpression = interpolateValue(stops);
    const minRadius = this.theme.minRadius[level];
    const maxRadius = this.theme.maxRadius[level];

    const radiusScaleTheme = this.theme.radiusScale[getType(sensor)];

    const currentRadiusScale = parseScaleSpec(radiusScaleTheme)
      .domain(valueMinMax)
      .range([minRadius, maxRadius])
      .clamp(true);

    const radiusExpression = currentRadiusScale.expr(['to-number', ['feature-state', 'value'], 0]);

    map.setPaintProperty(toBubbleLayer(level), 'circle-stroke-color', colorExpression);
    map.setPaintProperty(toBubbleLayer(level), 'circle-color', colorExpression);
    map.setPaintProperty(toBubbleLayer(level), 'circle-radius', radiusExpression);

    return currentRadiusScale;
  }

  updateSources() {
    // dummy
  }
}
