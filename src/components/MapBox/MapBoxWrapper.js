import { Map as MapBox, AttributionControl } from 'mapbox-gl';
import { L, addCityLayers } from './layers';
import { S, geoJsonSources } from './sources';
import { ChoroplethEncoding, BubbleEncoding, SpikeEncoding } from './encodings';
import { MAP_THEME, ENCODING_BUBBLE_THEME, ENCODING_SPIKE_THEME } from '../../theme';
import { levels } from '../../stores';
import { levelsWithMega, levelMegaCounty } from '../../stores/constants';
import { IS_NOT_MISSING } from './encodings/utils';
import InteractiveMap from './InteractiveMap';
import ZoomMap from './ZoomMap';

export default class MapBoxWrapper {
  constructor() {
    /**
     * @type {MapBox | null}
     */
    this.map = null;
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
    const { bounds, fitBounds } = this.zoom.initZoom(showZone);
    this.map = new MapBox({
      attributionControl: false,
      container,
      style: './maps/mapbox_albers_usa_style.json',
      bounds,
      fitBounds,
    });
    this.map.addControl(new AttributionControl({ compact: true }));
    // .addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    //Disable touch zoom, it makes gesture scrolling difficult
    this.map.scrollZoom.disable();

    this.zoom.map = this.map;

    this.map.on('idle', () => {
      this.trigger('ready');
    });

    this.map.on('load', () => {
      this.addSources().then(() => {
        this.addLayers();
        this.interactive = new InteractiveMap(this.map, this);
        if (showZone) {
          this.zoom.showSWPA();
        }
        // TODO init based on selected county
        // // if ($currentLevel === 'state') -> show states()
        this.updateMap('init');
      });
    });
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
        data: r.zoneOutline,
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

    levelsWithMega.forEach((level) => {
      map.addLayer(
        {
          id: L[level].fill,
          source: S[level].border,
          type: 'fill',
          visibility: 'none',
          filter: IS_NOT_MISSING,
          paint: {
            'fill-outline-color': MAP_THEME.countyOutlineWhenFilled,
            'fill-color': MAP_THEME.countyFill,
          },
        },
        L[level].hover,
      );

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
      visibility: 'none',
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
    if (this.map) {
      this.map.remove();
      this.zoom.map = null;
      this.map = null;
    }
  }
}
