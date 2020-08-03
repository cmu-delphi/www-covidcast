import { L } from '../layers';
import { S } from '../sources';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';

export default class BubbleEncoding {
  constructor(theme) {
    this.theme = theme;
    this.layers = [L.bubble.fill, L.bubble.highlight.fill];
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') return [];
    return this.layers.concat([L[level].fill]);
  }

  addSources(map) {
    map.addSource(S.bubble, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
  }

  addLayers(map) {
    // 2 layers for bubbles

    map.addLayer(
      {
        id: L.bubble.fill,
        source: S.bubble,
        type: 'circle',
        visibility: 'none',
        filter: ['>', ['get', 'value'], 0],
        paint: {
          'circle-radius': 0,
          'circle-color': this.theme.color,
          'circle-stroke-color': this.theme.strokeColor,
          'circle-stroke-width': this.theme.strokeWidth,
          'circle-opacity': [
            'case',
            ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
            0,
            this.theme.opacity,
          ],
          'circle-stroke-opacity': [
            'case',
            ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
            0,
            this.theme.strokeOpacity,
          ],
        },
      },
      L.county.hover,
    );

    map.addLayer(
      {
        id: L.bubble.highlight.fill,
        source: S.bubble,
        type: 'circle',
        visibility: 'none',
        filter: ['>', ['get', 'value'], 0],
        paint: {
          'circle-radius': 0,
          'circle-color': this.theme.color,
          'circle-stroke-color': this.theme.strokeColor,
          'circle-stroke-width': this.theme.strokeWidthHighlighted,
          'circle-opacity': [
            'case',
            ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
            this.theme.opacity,
            0,
          ],
          'circle-stroke-opacity': [
            'case',
            ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
            this.theme.strokeOpacity,
            0,
          ],
        },
      },
      'city-point-unclustered-pit',
    );
  }

  encode(map, level, signalType, sensor, valueMinMax, stops) {
    map.setPaintProperty(L[level].fill, 'fill-color', this.theme.countyFill);
    // color scale (color + stroke color)
    let flatStops = stops.flat();
    let colorExpression = ['interpolate', ['linear'], ['get', 'value']].concat(flatStops);

    map.getSource(S.bubble).setData(map.getSource(S[level].center)._data);

    map.setPaintProperty(L.bubble.fill, 'circle-stroke-color', colorExpression);
    map.setPaintProperty(L.bubble.highlight.fill, 'circle-stroke-color', colorExpression);

    map.setPaintProperty(L.bubble.fill, 'circle-color', colorExpression);
    map.setPaintProperty(L.bubble.highlight.fill, 'circle-color', colorExpression);

    const minRadius = this.theme.minRadius[level],
      maxRadius = this.theme.maxRadius[level];

    const radiusScaleTheme = this.theme.radiusScale[getType(sensor)];

    const currentRadiusScale = parseScaleSpec(radiusScaleTheme).domain(valueMinMax).range([minRadius, maxRadius]);

    const radiusExpression = currentRadiusScale.expr();

    map.setPaintProperty(L.bubble.fill, 'circle-radius', radiusExpression);
    map.setPaintProperty(L.bubble.highlight.fill, 'circle-radius', radiusExpression);

    return currentRadiusScale;
  }
}
