import { L } from '../layers';
import { S } from '../sources';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';
import { HAS_VALUE, caseHoveredOrSelected, interpolateValue } from './utils';
import { levels } from '../../../stores';
import { ENCODING_SPIKE_THEME } from '../../../theme';

export default class SpikeEncoding2 {
  constructor(theme) {
    this.id = 'spike';
    this.theme = theme;
    this.layers = levels.map((level) => L[level].spike);

    this.heightScale = () => 0;
    this.sources = {};
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') {
      return [];
    }
    return [L[level].fill, L[level].spike];
  }

  generateSources(map, level = 'county') {
    const centers = map.getSource(S[level].center)._data;
    const size = this.theme.size[level];

    const spikes = {
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

    const spikeOutlines = {
      type: 'FeatureCollection',
      features: spikes.features.map((feature) => {
        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            type: 'MultiLineString',
          },
        };
      }),
    };
    return { fill: spikes, stroke: spikeOutlines };
  }

  /**
   * @param {import('mapbox-gl').Map} map
   */
  addSources(map) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='500' viewBox='0 0 20 100'><path d='M 0 100 L 10 0 L 20 100' fill='black' stroke='black'></path></svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    const image = new Image();
    image.onload = () => {
      map.addImage('spike', image, {
        pixelRatio: 2,
        sdf: true,
        stretchY: [[0, image.height]],
      });
    };
    image.src = dataUri;

    // levels.forEach((level) => {
    //   // generate a lookup
    //   this.sources[level] = this.generateSources(map, level);
    // });
    // map.addSource(S.spike.fill, {
    //   type: 'geojson',
    //   data: this.sources.county.fill,
    // });
    // map.addSource(S.spike.stroke, {
    //   type: 'geojson',
    //   data: this.sources.county.stroke,
    // });
  }

  /**
   *
   * @param {import('mapbox-gl').Map} map
   */
  addLayers(map, helpers) {
    levels.forEach((level) => {
      map.addLayer({
        id: L[level].spike,
        source: S[level].center,
        type: 'symbol',
        layout: {
          'icon-image': 'spike',
        },
      });
    });

    // // 4 layers for spikes
    // const addFillLayer = (id, reference, hovered = false) => {
    //   map.addLayer(
    //     {
    //       id,
    //       type: 'fill',
    //       source: S.spike.fill,
    //       filter: HAS_VALUE,
    //       paint: {
    //         'fill-color': 'transparent',
    //         'fill-outline-color': 'transparent',
    //         'fill-opacity': caseHoveredOrSelected(0, this.theme.fillOpacity, hovered),
    //       },
    //     },
    //     reference,
    //   );
    // };
    // addFillLayer(L.spike.fill, L.county.hover);
    // addFillLayer(L.spike.highlight.fill, 'city-point-unclustered-pit', true);
    // const addLineLayer = (id, reference, hovered = false, extraStyles = {}) => {
    //   map.addLayer(
    //     {
    //       id,
    //       type: 'line',
    //       source: S.spike.stroke,
    //       filter: HAS_VALUE,
    //       layout: {
    //         'line-cap': 'round',
    //         'line-join': 'round',
    //       },
    //       paint: {
    //         'line-color': 'transparent',
    //         ...extraStyles,
    //         'line-opacity': caseHoveredOrSelected(0, this.theme.strokeOpacity, hovered),
    //       },
    //     },
    //     reference,
    //   );
    // };
    // addLineLayer(L.spike.stroke, L.county.hover);
    // addLineLayer(L.spike.highlight.stroke, 'city-point-unclustered-pit', true, {
    //   'line-width': this.theme.strokeWidthHighlighted,
    // });
  }

  encode(map, level, signalType, sensor, valueMinMax, stops) {
    map.setPaintProperty(L[level].fill, 'fill-color', this.theme.countyFill);

    const valueMax = valueMinMax[1];
    const maxHeight = this.theme.maxHeight[level];

    const heightScaleTheme = this.theme.heightScale[getType(sensor)];

    this.heightScale = parseScaleSpec(heightScaleTheme).range([0, maxHeight]).domain([0, valueMax]);
    const expr = this.heightScale.expr(['to-number', ['feature-state', 'value'], 0]);
    // this.updateSources(map, level);

    map.setPaintProperty(L[level].spike, 'icon-color', interpolateValue(stops));
    map.setLayoutProperty(L[level].spike, 'icon-size', 0.2);
    // let flatStops = stops.flat();
    // let colorExpression = ['interpolate', ['linear'], ['get', 'value']].concat(flatStops);
    // map.setPaintProperty(L.spike.fill, 'fill-color', colorExpression);
    // map.setPaintProperty(L.spike.stroke, 'line-color', colorExpression);
    // map.setPaintProperty(L.spike.highlight.fill, 'fill-color', colorExpression);
    // map.setPaintProperty(L.spike.highlight.stroke, 'line-color', colorExpression);
    // map.setPaintProperty(L.spike.stroke, 'line-width', this.theme.strokeWidth[level]);

    return this.heightScale;
  }

  copyAndUpdate(source, ref) {
    source.features.forEach((feature, i) => {
      // update props
      feature.properties = ref.features[i].properties;
      // the 0 coordinate is value independent
      const poly = feature.geometry.coordinates[0];
      const base = poly[0][1];
      // update height
      poly[1][1] = base + this.heightScale(feature.properties.value);
    });
  }

  updateSources(map, level) {
    // const sources = this.sources[level];
    // const ref = map.getSource(S[level].center)._data;
    // // inject new data and rescale into our sources
    // this.copyAndUpdate(sources.fill, ref);
    // map.getSource(S.spike.fill).setData(sources.fill);
    // this.copyAndUpdate(sources.stroke, ref);
    // map.getSource(S.spike.stroke).setData(sources.stroke);
  }
}
