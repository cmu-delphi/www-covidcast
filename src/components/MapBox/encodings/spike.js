import { L } from '../layers';
import { S } from '../sources';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';

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

  encode(map, level, signalType, sensor, valueMinMax, stops) {
    map.setPaintProperty(L[level].fill, 'fill-color', this.theme.countyFill);
    const valueMax = valueMinMax[1],
      maxHeight = this.theme.maxHeight[level],
      size = this.theme.size[level];

    const heightScaleTheme = this.theme.heightScale[getType(sensor)];

    const heightScale = parseScaleSpec(heightScaleTheme).range([0, maxHeight]).domain([0, valueMax]);

    const centers = map.getSource(S[level].center)._data;
    const features = centers.features.filter((feature) => feature.properties.value > 0);

    const spikes = {
      type: 'FeatureCollection',
      features: features.map((feature) => {
        const center = feature.geometry.coordinates,
          value = feature.properties.value;
        return {
          geometry: {
            coordinates: [
              [
                [center[0] - size, center[1]],
                [center[0], center[1] + heightScale(value)],
                [center[0] + size, center[1]],
              ],
            ],
            type: 'Polygon',
          },
          properties: { value: value },
          type: 'Feature',
          id: feature.id,
        };
      }),
    };

    const spikeOutlines = {
      type: 'FeatureCollection',
      features: features.map((feature) => {
        const center = feature.geometry.coordinates,
          value = feature.properties.value;

        return {
          geometry: {
            coordinates: [
              [center[0] - size, center[1]],
              [center[0], center[1] + heightScale(value)],
              [center[0] + size, center[1]],
            ],
            type: 'LineString',
          },
          properties: { value: value },
          type: 'Feature',
          id: feature.id,
        };
      }),
    };

    let flatStops = stops.flat();
    let colorExpression = ['interpolate', ['linear'], ['get', 'value']].concat(flatStops);
    map.setPaintProperty(L.spike.fill, 'fill-color', colorExpression);
    map.setPaintProperty(L.spike.stroke, 'line-color', colorExpression);
    map.setPaintProperty(L.spike.highlight.fill, 'fill-color', colorExpression);
    map.setPaintProperty(L.spike.highlight.stroke, 'line-color', colorExpression);
    map.setPaintProperty(L.spike.stroke, 'line-width', this.theme.strokeWidth[level]);

    map.getSource(S.spike.fill).setData(spikes);
    map.getSource(S.spike.stroke).setData(spikeOutlines);

    return heightScale;
  }
}
