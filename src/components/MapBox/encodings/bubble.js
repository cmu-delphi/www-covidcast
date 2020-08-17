import { L, toHoverLayer, toFillLayer } from '../layers';
import { S, toCenterSource } from '../sources';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';
import { HAS_VALUE, caseHovered } from './utils';

export default class BubbleEncoding {
  constructor(theme) {
    this.id = 'bubble';
    this.theme = theme;
    this.layers = [L.bubble.fill, L.bubble.highlight.fill];
    this.sources = [S.bubble];
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') return [];
    return this.layers.concat([L[level].fill]);
  }

  addSources(map, adapter) {
    // copy from centers
    // level will update upon update sources
    const data = map.getSource(toCenterSource(adapter.level))._data;
    map.addSource(S.bubble, {
      type: 'geojson',
      data,
    });
  }

  addLayers(map, adapter) {
    // 2 layers for bubbles
    const addLayer = (id, before, hovered = false) => {
      map.addLayer(
        {
          id,
          source: S.bubble,
          type: 'circle',
          layout: {
            visibility: 'none',
          },
          filter: HAS_VALUE,
          paint: {
            'circle-radius': 0,
            'circle-color': this.theme.color,
            'circle-stroke-color': this.theme.strokeColor,
            'circle-stroke-width': this.theme.strokeWidth,
            'circle-opacity': caseHovered(0, this.theme.opacity, hovered),
            'circle-stroke-opacity': caseHovered(0, this.theme.strokeOpacity, hovered),
            ...adapter.animationOptions('circle-radius'),
          },
        },
        before,
      );
    };
    addLayer(L.bubble.fill, toHoverLayer(adapter.level));
    addLayer(L.bubble.highlight.fill, L.cityPoints.pit, true);
  }

  encode(map, level, signalType, sensor, valueMinMax, stops) {
    map.setPaintProperty(toFillLayer(level), 'fill-color', this.theme.countyFill);
    // color scale (color + stroke color)
    let flatStops = stops.flat();
    let colorExpression = ['interpolate', ['linear'], ['get', 'value']].concat(flatStops);

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

  updateSources(map, level) {
    // copy from centers in the right level
    map.getSource(S.bubble).setData(map.getSource(toCenterSource(level))._data);
  }
}
