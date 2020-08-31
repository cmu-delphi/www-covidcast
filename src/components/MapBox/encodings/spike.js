import { L } from '../layers';
import { getType } from '../../../data/signals';
import { parseScaleSpec } from '../../../stores/scales';
import { SpikeLayer } from './SpikeLayer';
import { levels } from '../../../stores';
import { S } from '../sources';

export default class SpikeEncoding {
  constructor(theme) {
    this.id = 'spike';
    this.theme = theme;
    this.layers = levels.map((level) => L[level].spike);
    this.customLayers = new Map(levels.map((level) => [level, new SpikeLayer(S[level].center)]));

    this.heightScale = () => 0;
  }

  getVisibleLayers(level, signalType) {
    if (signalType === 'direction') {
      return [];
    }
    return [L[level].fill, L[level].spike];
  }

  addSources() {}

  /**
   *
   * @param {import('mapbox-gl').Map} map
   */
  addLayers(map) {
    levels.forEach((level) => {
      map.addLayer(this.customLayers.get(level).asLayer(L[level].spike));
    });
  }

  encode(map, level, signalType, sensor, valueMinMax, stops) {
    map.setPaintProperty(L[level].fill, 'fill-color', this.theme.countyFill);

    const valueMax = valueMinMax[1];
    const maxHeight = this.theme.maxHeight[level];

    const heightScaleTheme = this.theme.heightScale[getType(sensor)];

    this.heightScale = parseScaleSpec(heightScaleTheme).range([0, maxHeight]).domain([0, valueMax]).clamp(true);
    this.customLayers.get(level).encode(heightScaleTheme, maxHeight, valueMax, stops);

    return this.heightScale;
  }

  updateSources(map, level) {
    this.customLayers.get(level).updateSources();
    // const source = this.sources[level];
    // const refSource = S[level].center;
    // const ref = map.getSource(refSource)._data;
    // // inject new data and rescale into our sources
    // source.features.forEach((feature, i) => {
    //   const refFeature = ref.features[i];
    //   const state = map.getFeatureState({ source: refSource, id: Number.parseInt(refFeature.id, 10) });
    //   // the 0 coordinate is value independent
    //   const poly = feature.geometry.coordinates[0];
    //   const base = poly[0][1];
    //   // update height
    //   poly[1][1] = base + this.heightScale(state.value);
    //   map.setFeatureState({ source: S.spike.fill, id: Number.parseInt(feature.id, 10) }, state);
    // });
    // map.getSource(S.spike.fill).setData(source);
  }
}
