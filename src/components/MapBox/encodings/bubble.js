import { L } from '../layers';
import { S } from '../sources';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';
import { caseMissing, interpolateValue } from './utils';
import { levels } from '../../../stores';

export default class BubbleEncoding {
  constructor(theme) {
    this.id = 'bubble';
    this.theme = theme;
    this.layers = levels.map((level) => L[level].bubble);
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') {
      return [];
    }
    return [L[level].fill, L[level].bubble];
  }

  addSources() {
    // dummy
  }

  addLayers(map, helpers) {
    // 2 layers for bubbles
    levels.forEach((level) => {
      map.addLayer({
        id: L[level].bubble,
        source: S[level].center,
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
          ...helpers.animationOptions('circle-radius'),
        },
      });
    });
  }

  encode(map, level, signalType, sensor, valueMinMax, stops) {
    // constant background
    map.setPaintProperty(L[level].fill, 'fill-color', this.theme.countyFill);

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

    map.setPaintProperty(L[level].bubble, 'circle-stroke-color', colorExpression);
    map.setPaintProperty(L[level].bubble, 'circle-color', colorExpression);
    map.setPaintProperty(L[level].bubble, 'circle-radius', radiusExpression);

    return currentRadiusScale;
  }

  updateSources() {
    // dummy
  }
}
