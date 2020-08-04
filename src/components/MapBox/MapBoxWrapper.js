import { Map as MapBox, AttributionControl } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { L, addCityLayers } from './layers';
import { S, geoJsonSources } from './sources';
import { ChoroplethEncoding, BubbleEncoding, SpikeEncoding } from './encodings';
import { MAP_THEME, ENCODING_BUBBLE_THEME, ENCODING_SPIKE_THEME } from '../../theme';
import { levelsWithMega, levelMegaCounty, levels } from '../../stores/constants';
import { IS_NOT_MISSING, MISSING_VALUE } from './encodings/utils';
import InteractiveMap from './InteractiveMap';
import ZoomMap from './ZoomMap';
import style from './mapbox_albers_usa_style.json';
import { is7DavIncidence } from '../../data/signals';

export default class MapBoxWrapper {
  /**
   *
   * @param {(type: string, data: any) => void} trigger
   */
  constructor(trigger) {
    this.trigger = trigger;
    /**
     * @type {MapBox | null}
     */
    this.map = null;
    this.mapReady = false;
    /**
     * @type {InteractiveMap | null}
     */
    this.interactive = null;
    /**
     * @type {(ChoroplethEncoding | BubbleEncoding | SpikeEncoding)[]}
     */
    this.encodings = [
      new ChoroplethEncoding(),
      new BubbleEncoding(ENCODING_BUBBLE_THEME),
      new SpikeEncoding(ENCODING_SPIKE_THEME),
    ];
    this.encoding = this.encodings[0];
    this.level = 'state'; // TODO
    this.zoom = new ZoomMap();
  }

  /**
   *
   * @param {HTMLElement} container
   */
  initMap(container, showZone = false) {
    this.map = new MapBox({
      attributionControl: false,
      container,
      style,
      // bounds: this.zoom.stateBounds,
      // fitBoundsOptions: this.zoom.stateBoundsOptions,
    });
    this.map.addControl(new AttributionControl({ compact: true }));
    // .addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    //Disable touch zoom, it makes gesture scrolling difficult
    this.map.scrollZoom.disable();

    this.zoom.initZoom(this.map, showZone);

    let resolveCallback = null;

    // promise when it is done
    const p = new Promise((resolve) => {
      resolveCallback = resolve;
    });

    this.map.on('idle', () => {
      this.trigger('idle');
    });

    this.map.on('load', () => {
      this.addSources()
        .then(() => {
          this.addLayers();
          this.interactive = new InteractiveMap(this.map, this);
          if (showZone) {
            this.zoom.showSWPA();
          }
        })
        .then(() => {
          this.mapReady = true;
          this.trigger('ready');
          resolveCallback(this);
        });
    });
    return p;
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
        data: r.state.border,
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
      enc.addLayers(map);
    });
  }

  destroy() {
    this.mapReady = false;
    if (this.map) {
      this.map.remove();
      this.zoom.map = null;
      this.map = null;
    }
  }

  updateOptions(encoding, level, signalType, sensor, valueMinMax, stops, stopsMega) {
    // changed the visibility of layers
    if (this.level !== level) {
      this.level = level;
      if (level === 'state') {
        // TODO show state labels
      }
    }
    this.encoding = this.encodings.find((d) => d.id === encoding);

    if (!this.map || !this.mapReady) {
      return;
    }

    // Reset all hover/click states.
    levelsWithMega.forEach((level) => this.map.removeFeatureState({ source: S[level].border }));

    const allEncodingLayers = this.encodings.flatMap((d) => d.layers).concat([L[levelMegaCounty.id].fill]);
    const visibleLayers = new Set(this.encoding.getVisibleLayers(level, signalType));

    allEncodingLayers.forEach((layer) => {
      this.map.setLayoutProperty(layer, 'visibility', visibleLayers.has(layer) ? 'visible' : 'none');
    });

    return this.encoding.encode(this.map, level, signalType, sensor, valueMinMax, stops, stopsMega);
  }

  /**
   *
   * @param {string} sourceId
   * @param {Map<string, [number, number]>} values
   * @param {Map<string, number>} directions
   * @param {string} sensor
   * @param {(props: any) => string | null} idExtractor
   * @param {boolean} updateData
   */
  updateSource(sourceId, values, directions, sensor, updateData, idExtractor) {
    if (!this.map) {
      return;
    }
    const source = this.map.getSource(sourceId);
    if (!source) {
      return;
    }
    const data = source._data; // semi hacky

    data.features.forEach((d) => {
      const id = idExtractor(d.properties);

      d.properties.value = MISSING_VALUE;
      d.properties.direction = MISSING_VALUE;

      if (!id) {
        return;
      }

      if (values.has(id)) {
        d.properties.value = values.get(id)[0];

        if (is7DavIncidence(sensor)) {
          d.properties.value = values.get(id)[0]; // 7-day avg
          d.properties.value1 = values.get(id)[1]; // count
        }
      }
      if (directions.has(id)) {
        d.properties.direction = directions.get(id);
      }
    });

    if (updateData) {
      source.setData(data);
    }
  }

  select(featureId) {
    if (!this.map || !this.interactive) {
      return;
    }
    this.interactive.select(featureId);

    // TODO
    //   this.map.getSource()
    //   // Get zoom and center of selected location
    //   let centersData = $geojsons.get(S[].center)['features'];
    //   let centerLocation;
    //   for (let i = 0; i < centersData.length; i++) {
    //     let info = centersData[i];
    //     if (info['properties']['id'] == selectedRegion['property_id']) {
    //       centerLocation = info['geometry']['coordinates'];
    //       break;
    //     }
    //   }

    //   // TODO better zoom
    //   let zoomLevel;
    //   if (selectedRegion['level'] === 'county') {
    //     zoomLevel = 6.5;
    //   } else if (selectedRegion['level'] === 'msa') {
    //     zoomLevel = 6;
    //   } else {
    //     zoomLevel = 5;
    //   }

    //   map.flyTo({ center: centerLocation, zoom: zoomLevel, essential: true });
    // }
  }
}
