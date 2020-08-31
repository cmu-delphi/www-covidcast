import { L } from '../layers';
import { S } from '../sources';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';
import { caseHoveredOrSelected, caseMissing, interpolateValue } from './utils';
import { levels } from '../../../stores';

export default class SpikeEncoding {
  constructor(theme) {
    this.id = 'spike';
    this.theme = theme;
    this.layers = [L.spike.fill, L.spike.stroke];
    this.interactiveSources = [S.spike.fill];

    this.heightScale = () => 0;
    this.sources = {};
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') {
      return [];
    }
    return this.layers.concat([L[level].fill]);
  }

  generateSources(map, level = 'county') {
    const centers = map.getSource(S[level].center)._data;
    const size = this.theme.size[level];

    return {
      type: 'FeatureCollection',
      features: centers.features.map((feature) => {
        const center = feature.geometry.coordinates;

        return {
          ...feature,
          geometry: {
            coordinates: [
              [
                [center[0] - size, center[1]],
                [center[0], center[1]],
                [center[0] + size, center[1]],
              ],
            ],
            type: 'Polygon',
          },
        };
      }),
    };
  }

  addSources(map) {
    levels.forEach((level) => {
      // generate a lookup
      this.sources[level] = this.generateSources(map, level);
    });
    map.addSource(S.spike.fill, {
      type: 'geojson',
      data: this.sources.county,
    });
  }

  addLayers(map) {
    map.addLayer({
      id: L.spike.fill,
      type: 'fill',
      source: S.spike.fill,
      paint: {
        'fill-color': 'transparent',
        'fill-outline-color': 'transparent',
        'fill-opacity': caseMissing(0, this.theme.fillOpacity),
      },
    });
    map.addLayer({
      id: L.spike.stroke,
      type: 'line',
      source: S.spike.fill,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': 'transparent',
        'line-width': caseHoveredOrSelected(this.theme.strokeWidthHighlighted, 1),
        'line-opacity': caseMissing(0, this.theme.strokeOpacity),
      },
    });
  }

  encode(map, level, signalType, sensor, valueMinMax, stops) {
    map.setPaintProperty(L[level].fill, 'fill-color', this.theme.countyFill);

    const valueMax = valueMinMax[1];
    const maxHeight = this.theme.maxHeight[level];

    const heightScaleTheme = this.theme.heightScale[getType(sensor)];

    this.heightScale = parseScaleSpec(heightScaleTheme).range([0, maxHeight]).domain([0, valueMax]).clamp(true);
    this.updateSources(map, level);

    const colorExpression = interpolateValue(stops);
    map.setPaintProperty(L.spike.fill, 'fill-color', colorExpression);
    map.setPaintProperty(L.spike.stroke, 'line-color', colorExpression);
    map.setPaintProperty(
      L.spike.stroke,
      'line-width',
      caseHoveredOrSelected(this.theme.strokeWidthHighlighted, this.theme.strokeWidth[level]),
    );

    return this.heightScale;
  }

  updateSources(map, level) {
    const source = this.sources[level];
    const refSource = S[level].center;
    const ref = map.getSource(refSource)._data;

    // inject new data and rescale into our sources
    source.features.forEach((feature, i) => {
      const refFeature = ref.features[i];
      const state = map.getFeatureState({ source: refSource, id: Number.parseInt(refFeature.id, 10) });
      // the 0 coordinate is value independent
      const poly = feature.geometry.coordinates[0];
      const base = poly[0][1];
      // update height
      poly[1][1] = base + this.heightScale(state.value);
      map.setFeatureState({ source: S.spike.fill, id: Number.parseInt(feature.id, 10) }, state);
    });
    map.getSource(S.spike.fill).setData(source);
  }
}
