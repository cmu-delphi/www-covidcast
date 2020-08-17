import 'mapbox-gl/dist/mapbox-gl.css';
import { bounds, loadSources } from '../../maps';
import { levelMegaCounty, levels } from '../../stores/constants';
import { ENCODING_BUBBLE_THEME, ENCODING_SPIKE_THEME, MAP_THEME } from '../../theme';
import AMapBoxWrapper from './AMapBoxWrapper';
import { BubbleEncoding, ChoroplethEncoding, SpikeEncoding } from './encodings';
import { addCityLayers, addStateLabelLayer, L } from './layers';
import { toBorderSource, valueProperties, S } from './sources';

const geoJsonSources = loadSources(valueProperties);

/**
 *
 * @param {import('mapbox-gl').Map} map
 */
function addCitySources(map) {
  return geoJsonSources.then((r) => {
    map.addSource(S.cityPoint, {
      type: 'geojson',
      data: r.cities,
    });
  });
}

export default class USMapBoxWrapper extends AMapBoxWrapper {
  /**
   *
   * @param {(type: string, data: any) => void} dispatch
   * @param {MapBoxWrapperOptions} options
   */
  constructor(dispatch) {
    super(dispatch, {
      bounds: bounds.states,
      encodings: [
        new ChoroplethEncoding(),
        new BubbleEncoding(ENCODING_BUBBLE_THEME),
        new SpikeEncoding(ENCODING_SPIKE_THEME),
      ],
      level: 'county',
      levels,
      hasMegaCountyLevel: true,
    });
  }

  addLevelSources() {
    const map = this.map;
    return geoJsonSources.then((r) => {
      map.addSource(toBorderSource(levelMegaCounty.id), {
        type: 'geojson',
        data: r.mega,
      });
      this.levels.forEach((level) => {
        this.addLevelSource(level, r[level].border, r[level].center);
      });
    });
  }

  addSources() {
    return Promise.all([addCitySources(this.map), this.addLevelSources()]).then(() => {
      for (const enc of this.encodings) {
        enc.addSources(this.map, this);
      }
    });
  }

  addLayers() {
    const map = this.map;
    // map.addLayer({
    //   id: L.county.stroke,
    //   source: S.county.border,
    //   type: 'fill',
    //   paint: {
    //     'fill-color': MAP_THEME.countyFill,
    //     'fill-outline-color': MAP_THEME.countyOutline,
    //     'fill-opacity': 0.4,
    //     ...this.animationOptions('fill-color'),
    //   },
    // });

    map.addLayer({
      id: L.outline,
      source: toBorderSource('state'),
      type: 'fill',
      paint: {
        'fill-color': MAP_THEME.stateFill,
        'fill-outline-color': MAP_THEME.stateOutline,
      },
    });

    this.addLevelLayer(levelMegaCounty.id);
    this.levels.forEach((level) => {
      this.addLevelLayer(level);
    });

    addCityLayers(map);
    addStateLabelLayer(map);
    this.encodings.forEach((enc) => {
      enc.addLayers(map, this);
    });
  }
}
