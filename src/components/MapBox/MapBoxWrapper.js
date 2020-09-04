import geojsonExtent from '@mapbox/geojson-extent';
import { Map as MapBox } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { defaultRegionOnStartup, levelMegaCounty, levels } from '../../stores/constants';
import { MAP_THEME, MISSING_COLOR } from '../../theme';
import { MISSING_VALUE, caseHoveredOrSelected, caseSelected, caseMissing } from './encodings/utils';
import InteractiveMap from './InteractiveMap';
import { addCityLayers, L } from './layers';
import style from './mapbox_albers_usa_style.json';
import { geoJsonSources, S } from './sources';
import ZoomMap from './ZoomMap';
import { observeResize, unobserveResize } from '../../util';
import { throttle } from 'lodash-es';

export default class MapBoxWrapper {
  /**
   *
   * @param {(type: string, data: any) => void} dispatch
   * @param {import('./encodings').Encoding[]} encodings
   */
  constructor(dispatch, encodings) {
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

    this.encodings = encodings;
    this.encoding = this.encodings[0];
    // set a good default value
    this.level = 'county';
    this.zoom = new ZoomMap();
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
      bounds: this.zoom.stateBounds,
      fitBounds: this.zoom.stateBoundsOptions,
      doubleClickZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      touchZoomRotate: true,
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
      this.addSources()
        .then(() => {
          this.addLayers();
          this.interactive = new InteractiveMap(this.map, this);
          this.zoom.showStateLabels(this.level === 'state');
        })
        .then(() => {
          this.zoom.ready();
          this.markReady('setup');
          resolveCallback(this);
        });
    });

    observeResize(container, () => {
      this.map.resize();
    });

    return p;
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
    const data = geoJsonSources.then((r) => {
      const map = this.map;
      map.addSource(S.cityPoint, {
        type: 'geojson',
        data: r.cities,
      });
      map.addSource(S[levelMegaCounty.id].border, {
        type: 'geojson',
        data: r.mega,
      });
      map.addSource(S.zoneOutline, {
        type: 'geojson',
        data: r.newZones,
      });
      levels.forEach((level) => {
        map.addSource(S[level].border, {
          type: 'geojson',
          data: r[level].border,
        });

        map.addSource(S[level].center, {
          type: 'geojson',
          data: r[level].center,
        });
      });
    });

    const sprites = this.addSprites();
    return Promise.all([data, sprites]);
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

    // fallback missing layer
    map.addLayer({
      id: L.state.stroke,
      source: S.state.border,
      type: 'fill',
      paint: {
        'fill-color': MISSING_COLOR,
        'fill-outline-color': MAP_THEME.stateOutline,
        'fill-pattern': 'hatching',
      },
    });

    [levelMegaCounty.id, ...levels].forEach((level) => {
      map.addLayer({
        id: L[level].fill,
        source: S[level].border,
        type: 'fill',
        layout: {
          visibility: 'none',
        },
        paint: {
          'fill-outline-color': MAP_THEME.countyOutlineWhenFilled,
          'fill-color': MAP_THEME.countyFill,
          'fill-opacity': caseMissing(0, 1),
          ...this.animationOptions('fill-color'),
        },
      });
    });

    map.addLayer({
      id: L.zoneOutline,
      source: S.zoneOutline,
      type: 'line',
      layout: {
        visibility: 'none',
      },
      paint: {
        'line-color': MAP_THEME.zoneOutline,
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });

    [levelMegaCounty.id, ...levels].forEach((level) => {
      map.addLayer({
        id: L[level].hover,
        source: S[level].border,
        type: 'line',
        layout: {
          visibility: 'none',
        },
        paint: {
          'line-color': caseSelected(MAP_THEME.selectedRegionOutline, MAP_THEME.hoverRegionOutline),
          'line-width': caseHoveredOrSelected(4, 0),
        },
      });
    });

    this.encodings.forEach((enc) => {
      enc.addLayers(map, this);
    });

    addCityLayers(map);
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

  updateOptions(encoding, level, signalType, sensor, valueMinMax, stops, stopsMega, scale) {
    // changed the visibility of layers
    const oldLevel = this.level;
    this.level = level;
    this.encoding = this.encodings.find((d) => d.id === encoding);

    if (!this.map || !this.mapSetupReady) {
      return;
    }

    if (oldLevel !== level) {
      this.zoom.showStateLabels(level === 'state');
    }

    const allEncodingLayers = this.encodings.flatMap((d) => d.layers).concat([L[levelMegaCounty.id].fill]);
    const visibleLayers = new Set(this.encoding.getVisibleLayers(level, signalType));

    if (level === 'county') {
      // draw mega in every encoding
      visibleLayers.add(L[levelMegaCounty.id].fill);
    }

    allEncodingLayers.forEach((layer) => {
      this.map.setLayoutProperty(layer, 'visibility', visibleLayers.has(layer) ? 'visible' : 'none');
    });

    const r = this.encoding.encode(this.map, {
      level,
      signalType,
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
        this._updateSource(S[levelMegaCounty.id].border, lookup, primaryValue);
      }
      this._updateSource(S[level].border, lookup, primaryValue);
      this._updateSource(S[level].center, lookup, primaryValue);

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
        (this.interactive.hovered.id == selection.id || oldSelection.id == selection.id)) ||
      (selection.level === levelMegaCounty.id &&
        (this.interactive.hovered.mega == selection.id || oldSelection.mega == selection.id))
    ) {
      return;
    }

    // fly to
    // should also work for mega counties
    const source = this.map.getSource(S[selection.level].border);
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
      source: S[feature.properties.level].border,
      id: typeof id === 'string' ? Number.parseInt(feature.id, 10) : feature.id,
    });
    return state.value == null || state.value === MISSING_VALUE;
  }

  selectRandom() {
    if (!this.map || !this.mapSetupReady) {
      return;
    }
    const defaultRegion = defaultRegionOnStartup[this.level];
    const source = this.map.getSource(S[this.level].border);
    if (!source) {
      return;
    }

    const defaultFeature = source._data.features.find((d) => d.properties.id === defaultRegion);
    if (defaultFeature && !this.isMissing(defaultFeature)) {
      this.interactive.forceHover(defaultFeature);
      this.dispatch('select', defaultFeature);
      return;
    }

    const viableFeatures = source._data.features.filter((d) => !this.isMissing(d));
    if (viableFeatures.length === 0) {
      return;
    }
    const index = Math.floor(Math.random() * (viableFeatures.length - 1));
    const randomFeature = viableFeatures[index];
    this.interactive.forceHover(randomFeature);
    this.dispatch('select', randomFeature);
  }
}
