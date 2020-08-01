import { L } from '../layers.js';
import { S } from '../sources.js';

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
}
