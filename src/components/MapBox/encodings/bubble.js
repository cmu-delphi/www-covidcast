import { L } from '../layers';
import { S } from '../sources';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';
import { levels } from '../../../stores';
import { BubbleLayer } from './BubbleLayer';

export default class BubbleEncoding {
  constructor(theme) {
    this.id = 'bubble';
    this.theme = theme;
    this.layers = levels.map((level) => L[level].bubble);
    this.customLayers = new Map(levels.map((level) => [level, new BubbleLayer(S[level].center, level)]));
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') {
      return [];
    }
    return [L[level].fill, L[level].bubble];
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
  addLayers(map) {
    levels.forEach((level) => {
      map.addLayer(this.customLayers.get(level).asLayer(L[level].bubble));
    });
  }
  // addLayers(map, helpers) {
  //   // 2 layers for bubbles
  //   levels.forEach((level) => {
  //     map.addLayer({
  //       id: L[level].bubble,
  //       source: S[level].center,
  //       type: 'circle',
  //       layout: {
  //         visibility: 'none',
  //       },
  //       paint: {
  //         'circle-radius': 0,
  //         'circle-color': this.theme.color,
  //         'circle-stroke-color': this.theme.strokeColor,
  //         'circle-stroke-width': this.theme.strokeWidth,
  //         'circle-opacity': caseMissing(0, this.theme.opacity),
  //         'circle-stroke-opacity': caseMissing(0, this.theme.strokeOpacity),
  //         ...helpers.animationOptions('circle-radius'),
  //       },
  //     });
  //   });
  // }

  encode(map, { level, sensor, valueMinMax, scale }) {
    // constant background
    map.setPaintProperty(L[level].fill, 'fill-color', this.theme.countyFill);

    // color scale (color + stroke color)
    // const colorExpression = interpolateValue(stops);
    const minRadius = this.theme.minRadius[level];
    const maxRadius = this.theme.maxRadius[level];

    const radiusScaleTheme = this.theme.radiusScale[getType(sensor)];

    const radiusScale = parseScaleSpec(radiusScaleTheme).domain(valueMinMax).range([minRadius, maxRadius]).clamp(true);

    this.customLayers.get(level).encode(radiusScale, scale);
    // const scaleExpression = currentRadiusScale.expr(['to-number', ['feature-state', 'value'], 0]);

    // const radiusExpression = [
    //   'interpolate',
    //   ['exponential', 2],
    //   ['/', ['zoom'], baseZoom],
    //   4,
    //   scaleExpression,
    //   10,
    //   ['*', 64, scaleExpression],
    // ];

    // map.setPaintProperty(L[level].bubble, 'circle-stroke-color', colorExpression);
    // map.setPaintProperty(L[level].bubble, 'circle-color', colorExpression);
    // map.setPaintProperty(L[level].bubble, 'circle-radius', radiusExpression);

    return radiusScale;
  }

  updateSources(map, level, lookup, primaryValue) {
    this.customLayers.get(level).updateSources(lookup, primaryValue);
  }
}
