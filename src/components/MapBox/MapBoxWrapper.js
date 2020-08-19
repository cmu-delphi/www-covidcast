import geojsonExtent from '@mapbox/geojson-extent';
import { AttributionControl, Map as MapBox } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { defaultRegionOnStartup, levelMegaCounty, levels, EPIDATA_CASES_OR_DEATH_VALUES } from '../../stores/constants';
import { MAP_THEME } from '../../theme';
import { IS_NOT_MISSING, MISSING_VALUE } from './encodings/utils';
import InteractiveMap from './InteractiveMap';
import { addCityLayers, L } from './layers';
import style from './mapbox_albers_usa_style.json';
import { geoJsonSources, S } from './sources';
import ZoomMap from './ZoomMap';

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
          this.zoom.showStateLabels(this.level === 'state');
        })
        .then(() => {
          this.zoom.ready();
          this.markReady('setup');
          resolveCallback(this);
        });
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
    return geoJsonSources.then((r) => {
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

      for (const enc of this.encodings) {
        enc.addSources(map);
      }
    });
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
    map.addLayer({
      id: L.county.stroke,
      source: S.county.border,
      type: 'fill',
      paint: {
        'fill-color': MAP_THEME.countyFill,
        'fill-outline-color': MAP_THEME.countyOutline,
        'fill-opacity': 0.4,
        ...this.animationOptions('fill-color'),
      },
    });

    map.addLayer({
      id: L.state.stroke,
      source: S.state.border,
      type: 'fill',
      paint: {
        'fill-color': MAP_THEME.stateFill,
        'fill-outline-color': MAP_THEME.stateOutline,
      },
    });

    [levelMegaCounty.id, ...levels].forEach((level) => {
      map.addLayer({
        id: L[level].fill,
        source: S[level].border,
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

      map.addLayer({
        id: L[level].hover,
        source: S[level].border,
        type: 'line',
        paint: {
          'line-color': MAP_THEME.hoverRegionOutline,
          'line-width': ['case', ['any', ['boolean', ['feature-state', 'hover'], false]], 4, 0],
        },
      });

      map.addLayer({
        id: L[level].selected,
        source: S[level].border,
        type: 'line',
        paint: {
          'line-color': MAP_THEME.selectedRegionOutline,
          'line-width': ['case', ['any', ['boolean', ['feature-state', 'select'], false]], 4, 0],
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

    addCityLayers(map);
    this.encodings.forEach((enc) => {
      enc.addLayers(map, this);
    });
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
    if (level === 'county') {
      this.updateSource(S[levelMegaCounty.id].border, lookup, primaryValue);
    }
    this.updateSource(S[level].border, lookup, primaryValue);
    this.updateSource(S[level].center, lookup, primaryValue);

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
  updateSourcesOnZoom() {
    if (!this.map || !this.mapSetupReady) {
      return;
    }
    for (const encoding of this.encodings) {
      encoding.updateSources(this.map, this.level);
    }
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
    const source = this.map.getSource(S[selection.level].border);
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
    const defaultRegion = defaultRegionOnStartup[this.level];
    const source = this.map.getSource(S[this.level].border);
    if (!source) {
      return;
    }

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
