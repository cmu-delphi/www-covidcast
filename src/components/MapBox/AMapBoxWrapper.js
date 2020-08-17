import geojsonExtent from '@mapbox/geojson-extent';
import { AttributionControl, Map as MapBox } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { defaultRegionOnStartup, levelMegaCounty, EPIDATA_CASES_OR_DEATH_VALUES } from '../../stores/constants';
import { MAP_THEME } from '../../theme';
import { IS_NOT_MISSING, MISSING_VALUE } from './encodings/utils';
import InteractiveMap from './InteractiveMap';
import { toFillLayer, toHoverLayer, toSelectedLayer } from './layers';
import style from './mapbox_albers_usa_style.json';
import { toBorderSource, toCenterSource } from './sources';
import ZoomMap from './ZoomMap';

/**
 * @typedef {object} MapBoxWrapperOptions
 * @property {import('./encodings').Encoding[]} encodings
 * @property {number[][]} bounds
 * @property {string} level
 * @property {string[]} levels
 * @property {boolean} hasMegaCountyLevel
 */
export default class AMapBoxWrapper {
  /**
   *
   * @param {(type: string, data: any) => void} dispatch
   * @param {MapBoxWrapperOptions} options
   */
  constructor(dispatch, options) {
    this.dispatch = dispatch;
    /**
     * @type {MapBox | null}
     */
    this.map = null;
    this.mapSetupReady = false;
    this.mapDataReady = false;
    this.mapEncodingReady = false;

    this.animationDuration = 0;

    /**
     * @type {InteractiveMap | null}
     */
    this.interactive = null;

    // set a good default value
    this.level = options.level;
    this.levels = options.levels;
    this.hasMegaCountyLevel = options.hasMegaCountyLevel;
    this.encodings = options.encodings;
    this.encoding = this.encodings[0];
    this.zoom = new ZoomMap(options.bounds);
  }

  /**
   *
   * @param {HTMLElement} container
   */
  initMap(container) {
    this.map = new MapBox({
      attributionControl: false,
      container,
      style,
      bounds: this.zoom.resetBounds,
      fitBounds: this.zoom.resetBoundsOptions,
    });
    this.zoom.map = this.map;
    this.map.addControl(new AttributionControl({ compact: true }));
    // .addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    //Disable touch zoom, it makes gesture scrolling difficult
    // this.map.scrollZoom.disable();

    let resolveCallback = null;

    // promise when it is done
    const p = new Promise((resolve) => {
      resolveCallback = resolve;
    });

    this.map.on('idle', () => {
      this.dispatch('idle');
    });

    this.map.on('load', () => {
      this.addSources()
        .then(() => {
          this.addLayers();
          this.interactive = new InteractiveMap(this.map, this);
        })
        .then(() => {
          this._setupReady();
          resolveCallback(this);
        });
    });
    return p;
  }

  _setupReady() {
    this.zoom.showStateLabels(this.level === 'state');
    this.zoom.ready();
    this.markReady('setup');
  }

  /**
   *
   * @param {'data' | 'setup' | 'encoding'} type
   */
  markReady(type) {
    switch (type) {
      case 'data': {
        if (this.mapDataReady) {
          return;
        }
        this.mapDataReady = true;
        this.dispatch('readyData');
        break;
      }
      case 'setup': {
        if (this.mapSetupReady) {
          return;
        }
        this.mapSetupReady = true;
        this.dispatch('readySetup');
        break;
      }
      case 'encoding': {
        if (this.mapEncodingReady) {
          return;
        }
        this.mapEncodingReady = true;
        this.dispatch('readyEncoding');
        break;
      }
    }
    // once all are ready
    if (this.mapSetupReady && this.mapEncodingReady && this.mapDataReady) {
      this.dispatch('ready');
    }
  }

  addSources() {
    // hook
    return Promise.resolve();
  }

  animationOptions(prop) {
    if (!this.animationDuration) {
      return {};
    }
    return {
      [prop + '-transition']: {
        duration: this.animationDuration,
        delay: 0,
      },
    };
  }

  addLevelSource(level, border, center) {
    this.map.addSource(toBorderSource(level), {
      type: 'geojson',
      data: border,
    });

    this.map.addSource(toCenterSource(level), {
      type: 'geojson',
      data: center,
    });
  }

  addLevelLayer(level) {
    this.map.addLayer({
      id: toFillLayer(level),
      source: toBorderSource(level),
      type: 'fill',
      filter: IS_NOT_MISSING,
      layout: {
        visibility: 'none',
      },
      paint: {
        'fill-outline-color': MAP_THEME.countyOutlineWhenFilled,
        'fill-color': MAP_THEME.countyFill,
        ...this.animationOptions('fill-color'),
      },
    });

    this.map.addLayer({
      id: toHoverLayer(level),
      source: toBorderSource(level),
      type: 'line',
      paint: {
        'line-color': MAP_THEME.hoverRegionOutline,
        'line-width': ['case', ['any', ['boolean', ['feature-state', 'hover'], false]], 4, 0],
      },
    });

    this.map.addLayer({
      id: toSelectedLayer(level),
      source: toBorderSource(level),
      type: 'line',
      paint: {
        'line-color': MAP_THEME.selectedRegionOutline,
        'line-width': ['case', ['any', ['boolean', ['feature-state', 'select'], false]], 4, 0],
      },
    });
  }

  addLayers() {
    // hook
  }

  destroy() {
    this.mapSetupReady = false;
    if (this.map) {
      this.map.remove();
      this.zoom.map = null;
      this.map = null;
    }
  }

  updateOptions(encoding, level, signalType, sensor, valueMinMax, stops, stopsMega) {
    // changed the visibility of layers
    const oldLevel = this.level;
    this.level = level;
    this.encoding = this.encodings.find((d) => d.id === encoding);

    if (!this.hasMegaCountyLevel) {
      stopsMega = null;
    }

    if (!this.map || !this.mapSetupReady) {
      return;
    }

    if (oldLevel !== level) {
      this.zoom.showStateLabels(level === 'state');
    }

    const allEncodingLayers = this.encodings.flatMap((d) => d.layers);
    allEncodingLayers.push(...this.levels.map((level) => toFillLayer(level)));
    if (this.hasMegaCountyLevel) {
      allEncodingLayers.push(toFillLayer(levelMegaCounty.id));
    }
    const visibleLayers = new Set(this.encoding.getVisibleLayers(level, signalType));

    if (level === 'county' && this.hasMegaCountyLevel) {
      // draw mega in every encoding
      visibleLayers.add(toFillLayer(levelMegaCounty.id));
    }

    allEncodingLayers.forEach((layer) => {
      this.map.setLayoutProperty(layer, 'visibility', visibleLayers.has(layer) ? 'visible' : 'none');
    });

    const r = this.encoding.encode(this.map, level, signalType, sensor, valueMinMax, stops, stopsMega);

    this.markReady('encoding');
    return r;
  }

  /**
   *
   * @param {'county' | 'state' | 'msa'} level
   * @param {import('../../data/fetchData').EpiDataRow[]>} data
   */
  updateSources(level, data, primaryValue = 'value') {
    if (!this.map || !this.mapSetupReady) {
      return;
    }
    const lookup = new Map(data.map((d) => [d.geo_value.toUpperCase(), d]));
    if (level === 'county' && this.hasMegaCountyLevel) {
      this.updateSource(toBorderSource(levelMegaCounty.id), lookup, primaryValue);
    }
    this.updateSource(toBorderSource(level), lookup, primaryValue);
    this.updateSource(toCenterSource(level), lookup, primaryValue);

    for (const encoding of this.encodings) {
      encoding.updateSources(this.map, level);
    }
    if (data.length > 0) {
      this.markReady('data');
    }
  }
  /**
   *
   * @param {string} sourceId
   * @param {Map<string, import('../../data/fetchData').EpiDataRow>} values
   */
  updateSource(sourceId, values, primaryValue = 'value') {
    if (!this.map) {
      return;
    }
    const source = this.map.getSource(sourceId);
    if (!source) {
      return;
    }
    const data = source._data; // semi hacky

    data.features.forEach((d) => {
      const id = d.properties.id;
      const entry = values.get(id);
      d.properties.value = entry ? entry[primaryValue] : MISSING_VALUE;
      d.properties.direction = entry ? entry.direction : MISSING_VALUE;
      EPIDATA_CASES_OR_DEATH_VALUES.forEach((key) => {
        d.properties[key] = entry && entry[key] != null ? entry[key] : MISSING_VALUE;
      });
    });

    source.setData(data);
    return data;
  }

  /**
   *
   * @param {import('../../maps/nameIdInfo').NameInfo | null} selection
   */
  select(selection) {
    if (!this.map || !this.interactive) {
      return;
    }
    const oldSelection = this.interactive.select(selection);

    // clear selection
    if ((oldSelection.id != null || oldSelection.mega != null) && !selection) {
      // fly out
      this.zoom.resetZoom();
      return;
    }

    // use == on purpose since it could be a number or string
    // if no selection or we hover the selection don't fly to
    if (
      !selection ||
      (selection.level !== levelMegaCounty.id &&
        (this.interactive.hovered.id == selection.propertyId || oldSelection.id == selection.propertyId)) ||
      (selection.level === levelMegaCounty.id &&
        (this.interactive.hovered.mega == selection.propertyId || oldSelection.mega == selection.propertyId))
    ) {
      return;
    }

    // fly to
    // should also work for mega counties
    const source = this.map.getSource(toBorderSource(selection.level));
    if (!source) {
      return;
    }
    // hacky
    const feature = source._data.features.find((d) => d.properties.id === selection.propertyId);

    if (!feature) {
      return;
    }
    // show in focus
    this.map.fitBounds(geojsonExtent(feature), {
      maxZoom: this.zoom.getZoom() * 1.5,
      linear: false,
      essential: true,
    });
  }

  selectRandom() {
    if (!this.map || !this.mapSetupReady) {
      return;
    }
    const source = this.map.getSource(toBorderSource(this.level));
    if (!source) {
      return;
    }

    const defaultRegion = defaultRegionOnStartup[this.level];
    const defaultFeature = source._data.features.find((d) => d.properties.id === defaultRegion);
    if (defaultFeature && defaultFeature.properties.value !== MISSING_VALUE) {
      this.interactive.forceHover(defaultFeature);
      this.dispatch('select', defaultFeature);
      return;
    }

    const viableFeatures = source._data.features.filter((d) => d.properties.value !== MISSING_VALUE);
    if (viableFeatures.length === 0) {
      return;
    }
    const index = Math.floor(Math.random() * (viableFeatures.length - 1));
    const randomFeature = viableFeatures[index];
    this.interactive.forceHover(randomFeature);
    this.dispatch('select', randomFeature);
  }
}
