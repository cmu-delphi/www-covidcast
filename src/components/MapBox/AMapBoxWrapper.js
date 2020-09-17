import geojsonExtent from '@mapbox/geojson-extent';
import { Map as MapBox } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { defaultRegionOnStartup, levelMegaCounty } from '../../stores/constants';
import { MAP_THEME, MISSING_COLOR } from '../../theme';
import { MISSING_VALUE } from './encodings/utils';
import InteractiveMap from './InteractiveMap';
import { toFillLayer, toHoverLayer } from './layers';
import style from './mapbox_albers_usa_style.json';
import { toBorderSource, toCenterSource } from './sources';
import ZoomMap from './ZoomMap';
import { observeResize, unobserveResize } from '../../util';
import { throttle } from 'lodash-es';

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
    this.mapSetupReadyPromiseResolver = () => undefined;
    this.mapSetupReadyPromise = new Promise((resolve) => {
      this.mapSetupReadyPromiseResolver = resolve;
    });
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
      doubleClickZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      touchZoomRotate: true,
      renderWorldCopies: false,
      antialias: true,
    });
    this.zoom.map = this.map;
    this.map.touchZoomRotate.disableRotation();
    // this.map.addControl(new AttributionControl({ compact: true }));
    // .addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const throttled = throttle((z) => this.dispatch('zoom', z), 100);

    this.map.on('zoom', () => {
      const z = this.map.getZoom() / this.zoom.stateZoom;
      for (const encoding of this.encodings) {
        if (typeof encoding.onZoom === 'function') {
          encoding.onZoom(z * window.devicePixelRatio);
        }
      }
      throttled(z);
    });

    let resolveCallback = null;

    // promise when it is done
    const p = new Promise((resolve) => {
      resolveCallback = resolve;
    });

    this.map.on('idle', () => {
      this.dispatch('idle');
    });

    this.map.on('load', () => {
      this.addSprites();
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

    observeResize(container, () => {
      this.map.resize();
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
        this.mapSetupReadyPromiseResolver();
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

  addSprites() {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.25, MISSING_COLOR);
    gradient.addColorStop(0.5, 'white');
    gradient.addColorStop(0.75, MISSING_COLOR);
    gradient.addColorStop(1, 'white');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const data = ctx.getImageData(0, 0, size, size);
    this.map.addImage('hatching', data, {
      sdf: true,
    });
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

  addFillLevelLayer(level) {
    this.map.addLayer({
      id: toFillLayer(level),
      source: toBorderSource(level),
      type: 'fill',
      layout: {
        visibility: 'none',
      },
      paint: {
        'fill-outline-color': MAP_THEME.countyOutlineWhenFilled,
        'fill-color': MAP_THEME.countyFill,
        'fill-opacity': [
          'case',
          // when missing
          ['==', ['to-number', ['feature-state', 'value'], MISSING_VALUE], MISSING_VALUE],
          0,
          // else interpolate
          1,
        ],
        ...this.animationOptions('fill-color'),
      },
    });
  }

  addHoverLevelLayer(level) {
    this.map.addLayer({
      id: toHoverLayer(level),
      source: toBorderSource(level),
      type: 'line',
      layout: {
        visibility: 'none',
      },
      paint: {
        'line-color': [
          'case',
          ['to-boolean', ['feature-state', 'select']],
          ['feature-state', 'select'],
          MAP_THEME.hoverRegionOutline,
        ],
        'line-width': [
          'case',
          ['any', ['to-boolean', ['feature-state', 'hover']], ['to-boolean', ['feature-state', 'select']]],
          4,
          0,
        ],
      },
    });
  }

  addLayers() {
    // hook
  }

  destroy() {
    this.mapSetupReady = false;
    if (this.map) {
      unobserveResize(this.map.getContainer());
      this.map.remove();
      this.zoom.map = null;
      this.map = null;
    }
  }

  validateLevel(level) {
    if (!this.levels.includes(level)) {
      return this.levels[0];
    }
    return level;
  }

  updateOptions(encoding, level, signalType, sensor, sensorType, valueMinMax, stops, stopsMega, scale) {
    level = this.validateLevel(level);
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

    allEncodingLayers.forEach((layer) => {
      this.map.setLayoutProperty(layer, 'visibility', visibleLayers.has(layer) ? 'visible' : 'none');
    });

    const r = this.encoding.encode(this.map, {
      level,
      signalType,
      sensorType,
      sensor,
      valueMinMax,
      stops,
      stopsMega,
      scale,
      baseZoom: this.zoom.stateZoom,
    });

    this.markReady('encoding');
    return r;
  }

  /**
   *
   * @param {'county' | 'state' | 'msa'} level
   * @param {Promise<import('../../data/fetchData').EpiDataRow[]>>} data
   */
  updateSources(level, data, primaryValue = 'value') {
    level = this.validateLevel(level);
    // flag to compare if we still load the same data
    const dataFlag = Math.random().toString(36);
    this._mapDataFlag = dataFlag;

    this.dispatch('loading', true);

    Promise.all([data, this.mapSetupReadyPromise]).then(([data]) => {
      if (this._mapDataFlag !== dataFlag) {
        // some other loading operation is done in the meanwhile
        return;
      }
      // once idle dispatch done loading
      this.map.once('idle', () => {
        this.dispatch('loading', false);
      });

      const lookup = new Map(data.map((d) => [d.geo_value.toUpperCase(), d]));
      this.interactive.data = lookup;

      if (level === 'county') {
        this._updateSource(toBorderSource(levelMegaCounty.id), lookup, primaryValue);
      }
      this._updateSource(toBorderSource(level), lookup, primaryValue);
      this._updateSource(toCenterSource(level), lookup, primaryValue);

      for (const encoding of this.encodings) {
        encoding.updateSources(this.map, level, lookup, primaryValue);
      }
      if (data.length > 0) {
        this.markReady('data');
      }
    });
  }
  /**
   *
   * @param {string} sourceId
   * @param {Map<string, import('../../data/fetchData').EpiDataRow>} values
   */
  _updateSource(sourceId, values, primaryValue = 'value') {
    console.assert(this.map != null);
    const source = this.map.getSource(sourceId);
    if (!source) {
      console.error('invalid source');
      return;
    }
    const data = source._data; // semi hacky

    data.features.forEach((d) => {
      const id = d.properties.id;
      const entry = values.get(id);
      this.map.setFeatureState(
        {
          source: sourceId,
          id: Number.parseInt(d.id, 10),
        },
        {
          value: entry ? entry[primaryValue] : MISSING_VALUE,
        },
      );
    });
  }

  /**
   * @param {{info: import('../../maps/nameIdInfo').NameInfo, color: string}[]} selections
   */
  selectMulti(selections) {
    if (!this.map || !this.interactive) {
      return;
    }
    if (selections.length <= 1) {
      const bak = this.interactive.selection.slice();
      this.select(selections.length > 0 ? selections[0].info : null);
      return bak;
    }
    return this.interactive.selectMulti(selections);
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
    if (oldSelection != null && !selection) {
      // fly out
      this.zoom.resetZoom();
      return;
    }

    if (!selection || this.interactive.isHovered(selection)) {
      return;
    }

    // fly to
    // should also work for mega counties
    const source = this.map.getSource(toBorderSource(selection.level));
    if (!source) {
      return;
    }
    // hacky
    const feature = source._data.features.find((d) => d.id === selection.id);

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

  isMissing(feature) {
    const state = this.map.getFeatureState({
      source: toBorderSource(feature.properties.level),
      id: typeof id === 'string' ? Number.parseInt(feature.id, 10) : feature.id,
    });
    return state.value == null || state.value === MISSING_VALUE;
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
    if (defaultFeature && !this.isMissing(defaultFeature)) {
      this.interactive.forceHover(defaultFeature);
      this.dispatch('select', { feature: defaultFeature });
      return;
    }

    const viableFeatures = source._data.features.filter((d) => !this.isMissing(d));
    if (viableFeatures.length === 0) {
      return;
    }
    const index = Math.floor(Math.random() * (viableFeatures.length - 1));
    const randomFeature = viableFeatures[index];
    this.interactive.forceHover(randomFeature);
    this.dispatch('select', { feature: randomFeature });
  }
}
