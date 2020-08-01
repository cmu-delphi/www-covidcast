import { L } from '../layers.js';
import { S } from '../sources.js';

export default class SpikeEncoding {
  constructor(theme) {
    this.theme = theme;
    this.layers = [L.spike.fill, L.spike.stroke, L.spike.highlight.fill, L.spike.highlight.stroke];
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') return [];
    return this.layers.concat([L[level].fill]);
  }

  addSources(map) {
    map.addSource(S.spike.fill, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    map.addSource(S.spike.stroke, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
  }

  addLayers(map) {
    // 4 layers for spikes

    map.addLayer(
      {
        id: L.spike.fill,
        type: 'fill',
        source: S.spike.fill,
        filter: ['>', ['get', 'value'], 0],
        paint: {
          'fill-color': 'transparent',
          'fill-opacity': [
            'case',
            ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
            0,
            this.theme.fillOpacity,
          ],
          'fill-outline-color': 'transparent',
        },
      },
      L.county.hover,
    );

    map.addLayer(
      {
        id: L.spike.stroke,
        type: 'line',
        source: S.spike.stroke,
        filter: ['>', ['get', 'value'], 0],
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': 'transparent',
          'line-opacity': [
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
        id: L.spike.highlight.fill,
        type: 'fill',
        source: S.spike.fill,
        filter: ['>', ['get', 'value'], 0],
        paint: {
          'fill-color': 'transparent',
          'fill-opacity': [
            'case',
            ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
            this.theme.fillOpacity,
            0,
          ],
          'fill-outline-color': 'transparent',
        },
      },
      'city-point-unclustered-pit',
    );

    map.addLayer(
      {
        id: L.spike.highlight.stroke,
        type: 'line',
        source: S.spike.stroke,
        filter: ['>', ['get', 'value'], 0],
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': 'transparent',
          'line-width': this.theme.strokeWidthHighlighted,
          'line-opacity': [
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
