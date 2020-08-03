import { L } from '../layers';
import { S } from '../sources';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';
import { HAS_VALUE, caseHovered, addSource } from './utils';

export default class SpikeEncoding {
  constructor(theme) {
    this.id = 'spike';
    this.theme = theme;
    this.layers = [L.spike.fill, L.spike.stroke, L.spike.highlight.fill, L.spike.highlight.stroke];
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') return [];
    return this.layers.concat([L[level].fill]);
  }

  addSources(map) {
    addSource(map, S.spike.fill);
    addSource(map, S.spike.stroke);
  }

  addLayers(map) {
    // 4 layers for spikes
    const addFillLayer = (id, reference, hovered = false) => {
      map.addLayer(
        {
          id,
          type: 'fill',
          source: S.spike.fill,
          filter: HAS_VALUE,
          paint: {
            'fill-color': 'transparent',
            'fill-outline-color': 'transparent',
            'fill-opacity': caseHovered(0, this.theme.fillOpacity, hovered),
          },
        },
        reference,
      );
    };
    addFillLayer(L.spike.fill, L.county.hover);
    addFillLayer(L.spike.highlight.fill, 'city-point-unclustered-pit', true);

    const addLineLayer = (id, reference, hovered = false, extraStyles = {}) => {
      map.addLayer(
        {
          id,
          type: 'line',
          source: S.spike.stroke,
          filter: HAS_VALUE,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': 'transparent',
            ...extraStyles,
            'line-opacity': caseHovered(0, this.theme.strokeOpacity, hovered),
          },
        },
        reference,
      );
    };
    addLineLayer(L.spike.stroke, L.county.hover);
    addLineLayer(L.spike.highlight.stroke, 'city-point-unclustered-pit', true, {
      'line-width': this.theme.strokeWidthHighlighted,
    });
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
