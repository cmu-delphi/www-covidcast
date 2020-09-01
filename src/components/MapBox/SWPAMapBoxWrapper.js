import 'mapbox-gl/dist/mapbox-gl.css';
import { bounds, loadSWPASources } from '../../maps';
import { swpaLevels } from '../../stores/constants';
import { MAP_THEME, ENCODING_BUBBLE_THEME, ENCODING_SPIKE_THEME } from '../../theme';
import AMapBoxWrapper from './AMapBoxWrapper';
import { ChoroplethEncoding, BubbleEncoding, SpikeEncoding } from './encodings';
import { L } from './layers';
import { toBorderSource } from './sources';

const geoJsonSources = loadSWPASources();

export default class USMapBoxWrapper extends AMapBoxWrapper {
  /**
   *
   * @param {(type: string, data: any) => void} dispatch
   * @param {MapBoxWrapperOptions} options
   */
  constructor(dispatch) {
    super(dispatch, {
      bounds: bounds.hrr,
      encodings: [
        new ChoroplethEncoding(swpaLevels),
        new BubbleEncoding(ENCODING_BUBBLE_THEME, swpaLevels),
        new SpikeEncoding(ENCODING_SPIKE_THEME, swpaLevels),
      ],
      level: 'county',
      levels: swpaLevels,
      hasMegaCountyLevel: false,
    });
  }

  addLevelSources() {
    return geoJsonSources.then((r) => {
      this.map.addSource(toBorderSource('hrr'), {
        type: 'geojson',
        data: r.hrr,
      });
      this.levels.forEach((level) => {
        this.addLevelSource(level, r[level].border, r[level].center);
      });
    });
  }

  addSources() {
    return this.addLevelSources().then(() => {
      for (const enc of this.encodings) {
        enc.addSources(this.map, this);
      }
    });
  }

  addLayers() {
    const map = this.map;
    map.addLayer({
      id: L.outline,
      source: toBorderSource('hrr'),
      type: 'fill',
      paint: {
        'fill-color': MAP_THEME.stateFill,
        'fill-outline-color': MAP_THEME.stateOutline,
      },
    });

    this.levels.forEach((level) => {
      this.addFillLevelLayer(level);
    });
    this.levels.forEach((level) => {
      this.addHoverLevelLayer(level);
    });
    this.encodings.forEach((enc) => {
      enc.addLayers(map, this);
    });
    map.addLayer({
      id: 'hrr-stroke',
      source: toBorderSource('hrr'),
      type: 'line',
      paint: {
        'line-color': MAP_THEME.zoneOutline,
      },
    });
  }
}
