<script>
  import mapboxgl from 'mapbox-gl';
  import {
    levels,
    stats,
    currentRegion,
    currentRegionName,
    geojsons,
    currentSensor,
    currentLevel,
    currentDate,
    currentData,
    currentRange,
    signalType,
    currentDataReadyOnMay,
    metaData,
    sensors,
  } from './stores.js';
  import { DIRECTION_THEME, MAP_THEME } from './theme.js';

  const LAT = -1.2;
  const LON = -0.5;
  const ZOOM = 4.3; // should be set to 4.4 as default

  let container;
  let map;
  let popup;
  let hoveredId;
  let clickedId;

  // Boolean tracking if the map has been initialized.
  let mounted = false;

  // Mouse event handlers
  const onMouseEnter = level => e => {
    // popup
    map.getCanvas().style.cursor = 'pointer';

    var title = e.features[0].properties.NAME;
    popup
      .setLngLat(e.lngLat)
      .setHTML(title)
      .addTo(map);
  };
  const onMouseMove = level => e => {
    // hover state
    if (hoveredId) {
      map.setFeatureState({ source: level, id: hoveredId }, { hover: false });
    }
    hoveredId = e.features[0].id;
    map.setFeatureState({ source: level, id: hoveredId }, { hover: true });

    // popup
    var title = e.features[0].properties.NAME;
    popup.setLngLat(e.lngLat).setHTML(title);
  };
  const onMouseLeave = level => e => {
    // hover state
    if (hoveredId) {
      map.setFeatureState({ source: level, id: hoveredId }, { hover: false });
    }
    hoveredId = null;

    map.getCanvas().style.cursor = '';
    popup.remove();
  };
  const onClick = level => e => {
    if (clickedId) {
      map.setFeatureState({ source: level, id: clickedId }, { select: false });
    }

    if (clickedId !== e.features[0].id) {
      clickedId = e.features[0].id;
      console.log(clickedId);
      map.setFeatureState({ source: level, id: clickedId }, { select: true });
      currentRegionName.set(e.features[0].properties.NAME);
      currentRegion.set(e.features[0].properties.id);
    } else {
      clickedId = null;
      currentRegionName.set('');
      currentRegion.set('');
    }
  };

  // If it hasn't been initialized and we have geojsons and initial data, create map.
  $: if (
    !map &&
    $geojsons.size !== 0 &&
    //  && $currentData.length !== 0
    $metaData.length !== 0 &&
    $stats
  ) {
    initializeMap();
  }

  // Update the map when sensor or level changes.
  currentData.subscribe(_ => {
    try {
      updateMap('data');
    } catch (err) {
      console.log(err);
    }
  });
  currentLevel.subscribe(_ => {
    try {
      updateMap('data');
    } catch (err) {
      console.log(err);
    }
  });
  currentDate.subscribe(_ => {
    try {
      updateMap('data');
    } catch (err) {
      console.log(err);
    }
  });
  signalType.subscribe(_ => {
    try {
      updateMap('signal');
    } catch (err) {
      console.log(err);
    }
  });

  function updateMap(type) {
    if (!mounted) return;
    window.performance.mark('update-map-start');
    Object.keys($levels).forEach(level => map && map.removeFeatureState({ source: level }));

    if (type === 'data') {
      map.getLayer($currentLevel) && map.removeLayer($currentLevel);
    }

    let thisMeta = $metaData.find(d => d.data_source === $currentSensor && d.geo_type === $currentLevel);
    let sts = $stats.get($currentSensor);
    let valueMinMax = [sts.mean - 2 * sts.std, sts.mean + 2 * sts.std];
    // console.log(thisMeta);

    // let valueMinMax = [thisMeta.min_value, thisMeta.max_value];
    let valueMappedVals = new Map();
    let directionMappedVals = new Map();

    let geoIds = new Set(
      $currentData.map(d => {
        const key = d.geo_value.toUpperCase();

        if (d.value !== null) {
          valueMappedVals.set(key, d.value);
        }
        if (d.direction !== null) {
          directionMappedVals.set(key, d.direction);
        }

        return key;
      }),
    );

    currentRange.set($signalType === 'value' ? valueMinMax : [-1, 1]);

    let dat = $geojsons.get($currentLevel);
    dat.features.forEach(d => {
      const id = d.properties.id;

      d.properties.value = -100;
      d.properties.direction = -100;
      if (geoIds.has(id) && valueMappedVals.get(id) !== null) {
        d.properties.value = valueMappedVals.get(id);
      }
      if (geoIds.has(id) && directionMappedVals.get(id) !== null) {
        d.properties.direction = directionMappedVals.get(id);
      }
    });

    let stops;
    if ($signalType === 'value') {
      let center = valueMinMax[0] + (valueMinMax[1] - valueMinMax[0]) / 2;
      stops = [
        [valueMinMax[0], DIRECTION_THEME.gradientMin],
        [center, DIRECTION_THEME.gradientMiddle],
        [valueMinMax[1], DIRECTION_THEME.gradientMax],
      ];
    } else {
      stops = [[-1, DIRECTION_THEME.decreasing], [0, DIRECTION_THEME.steady], [1, DIRECTION_THEME.increasing]];
    }
    console.log('data update');
    console.log(dat);
    if (['data', 'init'].includes(type)) {
      map.getSource($currentLevel).setData(dat);
    }

    Object.keys($levels).forEach(name => {
      if (name === $currentLevel) {
        if (map.getLayer(name)) {
          map.setPaintProperty(name, 'fill-color', {
            property: $signalType,
            stops: stops,
          });
          map.setLayoutProperty(name, 'visibility', 'visible');
        } else {
          map.addLayer(
            {
              id: $currentLevel,
              source: $currentLevel,
              type: 'fill',
              filter: ['!=', $signalType, -100],
              paint: {
                'fill-outline-color': '#616161',
                'fill-color': {
                  property: $signalType,
                  stops: stops,
                },
              },
            },
            `${$currentLevel}-hover`,
          );
        }
      } else {
        map.getLayer(name) && map.setLayoutProperty(name, 'visibility', 'none');
      }
    });

    if (type === 'init') {
      const viableFeatures = dat.features.filter(f => f.properties[$signalType] !== -100);

      const index = Math.floor(Math.random() * (viableFeatures.length - 1));
      console.log(dat.features);
      console.log(viableFeatures, viableFeatures.length, index);
      const randomFeature = viableFeatures[index];
      console.log(randomFeature);
      currentRegionName.set(randomFeature.properties.NAME);
      currentRegion.set(randomFeature.properties.id);
      clickedId = randomFeature.id;
      map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: true });
    }

    currentDataReadyOnMay.set(true);
    window.performance.measure('update-map', 'update-map-start');
  }

  function initializeMap() {
    map = new mapboxgl.Map({
      attributionControl: false,
      container,
      style: './maps/mapbox_albers_usa_style.json',
      center: [LON, LAT],
      zoom: ZOOM,
      minZoom: ZOOM,
    })
      .addControl(new mapboxgl.AttributionControl({ compact: true }))
      .addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('data', ev => {
      if (ev.dataType === 'source') {
        if (ev.coord && ev.coord.key) {
          if (ev.isSourceLoaded) {
            window.performance.measure(`Load ${ev.coord.key}`, `Start Load ${ev.coord.key}`);
          } else {
            window.performance.mark(`Start Load ${ev.coord.key}`);
          }
        } else {
          window.performance.measure(`Load Data`, `Start Load Data`);
        }
      } else {
        // console.log(ev);
      }
    });
    map.on('dataloading', ev => {
      if (ev.dataType === 'source') {
        if (ev.coord && ev.coord.key) {
          if (ev.isSourceLoaded) {
            window.performance.measure(`Load ${ev.coord.key}`, `Start Load ${ev.coord.key}`);
          } else {
            window.performance.mark(`Start Load ${ev.coord.key}`);
          }
        } else {
          window.performance.mark(`Start Load Data`);
        }
      } else {
        // console.log(ev);
      }
    });

    //Disable touch zoom, it makes gesture scrolling difficult
    map.scrollZoom.disable();

    map.on('load', function() {
      map.addSource('county-outline', {
        type: 'geojson',
        data: $geojsons.get('county'),
      });
      map.addSource('state-outline', {
        type: 'geojson',
        data: $geojsons.get('state'),
      });
      map.addSource('city-point', {
        type: 'geojson',
        data: $geojsons.get('city'),
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 100, // Radius of each cluster when clustering points (defaults to 50),
        clusterProperties: {
          largest: [
            [
              'case',
              ['<', ['get', 'rank', ['accumulated']], ['get', 'rank', ['get', 'largest']]],
              ['accumulated'],
              ['properties'],
            ],
            ['properties'],
          ],
        },
      });
      map.addLayer({
        id: 'county-outline',
        source: 'county-outline',
        type: 'fill',
        paint: {
          'fill-color': MAP_THEME.countyFill,
          'fill-outline-color': MAP_THEME.countyOutline,
          'fill-opacity': 0.4,
        },
      });
      map.addLayer({
        id: 'state-outline',
        source: 'state-outline',
        type: 'fill',
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0)',
          'fill-outline-color': MAP_THEME.stateOutline,
        },
      });

      Object.keys($levels).forEach(name => {
        const data = $geojsons.get(name);
        map.addSource(name, {
          type: 'geojson',
          data: $geojsons.get(name),
        });
        console.log(data);
        map.addLayer({
          id: `${name}-hover`,
          source: name,
          type: 'line',
          paint: {
            'line-color': MAP_THEME.hoverRegionOutline,
            'line-width': ['case', ['any', ['boolean', ['feature-state', 'hover'], false]], 2, 0],
          },
        });
        map.addLayer({
          id: `${name}-selected`,
          source: name,
          type: 'line',
          paint: {
            'line-color': MAP_THEME.selectedRegionOutline,
            'line-width': ['case', ['any', ['boolean', ['feature-state', 'select'], false]], 2, 0],
          },
        });
      });

      map.addLayer({
        id: 'city-point-unclustered',
        source: 'city-point',
        type: 'symbol',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'city'],
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
        },
        paint: {
          'text-halo-color': '#fff',
          'text-halo-width': 2,
        },
      });
      map.addLayer({
        id: 'city-point-clustered',
        source: 'city-point',
        type: 'symbol',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'city', ['get', 'largest']],
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
        },
        paint: {
          'text-halo-color': '#fff',
          'text-halo-width': 2,
        },
      });

      mounted = true;
      updateMap('init');
    });

    popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'map-popup',
    });
    Object.keys($levels).forEach(level => {
      map.on('mouseenter', level, onMouseEnter(level));
      map.on('mousemove', level, onMouseMove(level));
      map.on('mouseleave', level, onMouseLeave(level));
      map.on('click', level, onClick(level));
    });
  }

  function zoomBack() {}
</script>

<style>
  .map-container {
    width: 100%;
    height: 90vh;
    position: relative;
  }

  .state-buttons-holder {
    position: absolute;
    top: 92px;
    right: 9px;
    z-index: 100;
  }

  .state-buttons-holder button:focus {
    outline: none;
  }

  .state-buttons-holder .pg-button {
    font-size: 23px;
    position: relative;
    width: 29px;
    height: 29px;
    color: #3a3a3a;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    padding: 0;
    box-sizing: content-box;
    background-color: white;
    border: 1px solid #d5d5d5;
    border-radius: 4px;
    text-align: center;
    font-family: 'FranklinITCProBold', Helvetica, Arial, sans-serif;
    line-height: 16px;
    cursor: pointer;
    text-decoration: none;
    user-select: none;
    transition-delay: 0s;
    transition-duration: 0.15s;
    transition-property: background-color;
    transition-timing-function: ease-in-out;
  }

  .state-buttons-holder .pg-button:hover {
    background-color: rgb(213, 213, 213);
  }

  .state-buttons-holder .pg-button img {
    width: 90%;
    /* height: 100%; */
  }
</style>

<div bind:this={container} class="map-container">
  <div class="state-buttons-holder">
    <button
      aria-label="show entire map"
      data-state="us48"
      id="bounds-button"
      class="pg-button bounds-button"
      on:click={_ => map.easeTo({ center: [LON, LAT], zoom: ZOOM })}>
      <img src="./assets/imgs/us48.png" alt="" />
    </button>
  </div>
</div>
