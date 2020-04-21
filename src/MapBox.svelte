<script>
  import { onMount } from 'svelte';
  import colorParse from 'color-parse';
  import invertColor from 'invert-color';
  import debounce from 'lodash/debounce';
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
    mounted,
  } from './stores.js';
  import { DIRECTION_THEME, MAP_THEME } from './theme.js';

  let LAT = -1.2;
  let LON = -0.5;
  let ZOOM = 3.9; // should be set to 4.3 as default

  let container;
  let map;
  let popup;
  let hoveredId;
  let clickedId;

  /*
  bgColor:string - 'rgb(xx,yy,zz)'
*/
  function getTextColorBasedOnBackground(bgColor) {
    return invertColor(colorParse(bgColor).values, true);
  }

  onMount(_ => {
    let containerWidth = container.clientWidth;
    ////console.log('map view width:', containerWidth);
    if (containerWidth <= 1021) {
      ZOOM = 3.9;
    } else if (containerWidth > 1021 && containerWidth < 1280) {
      ZOOM = 4.1;
    } else if (containerWidth >= 1280) {
      ZOOM = 4.3;
    }
  });

  // Boolean tracking if the map has been initialized.
  let mapMounted = false;
  let chosenRandom = false;

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
    // var title = e.features[0].properties.NAME;
    const { value, direction, NAME } = e.features[0].properties;
    const fillColor = e.features[0].layer.paint['fill-color'].toString();
    var title = `
      <div class="map-popup-region-name">
      ${NAME} ${$currentLevel === 'county' ? 'County' : ''}
      </div>
      <div class="map-popup-region-value-container">
        ${
          $signalType === 'value'
            ? $currentSensor !== 'ght'
              ? 'Percentage: <span class="map-popup-region-value" style="background-color: ' +
                fillColor +
                '; color: ' +
                getTextColorBasedOnBackground(fillColor) +
                ';">' +
                value.toFixed(2) +
                '%</span>'
              : 'Relative Frequency: <span class="map-popup-region-value" style="background-color: ' +
                fillColor +
                '; color: ' +
                getTextColorBasedOnBackground(fillColor) +
                ';">' +
                value.toFixed(2) +
                '</span>'
            : ''
        }
        ${
          $signalType === 'direction'
            ? 'Direction: ' +
              (direction === 1
                ? '<span class="map-popup-region-value" style="background-color: ' +
                  DIRECTION_THEME.increasing +
                  '; color: ' +
                  getTextColorBasedOnBackground(DIRECTION_THEME.increasing) +
                  '">&#8599; Increasing</span>'
                : direction === -1
                ? '<span class="map-popup-region-value" style="background-color: ' +
                  DIRECTION_THEME.decreasing +
                  '; color: ' +
                  getTextColorBasedOnBackground(DIRECTION_THEME.decreasing) +
                  '">&#8600; Decreasing</span>'
                : direction === 0
                ? '<span class="map-popup-region-value" style="background-color: ' +
                  DIRECTION_THEME.steady +
                  '; color: ' +
                  getTextColorBasedOnBackground(DIRECTION_THEME.steady) +
                  '">&#8594; Steady</span>'
                : '<span class="map-popup-region-value">n/a</span>')
            : ''
        }
      </div>
    `;
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
      ////console.log(e.features[0]);
      clickedId = e.features[0].id;
      ////console.log(clickedId);
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
  $: if (!map && $geojsons.size !== 0 && $metaData.length !== 0 && $stats) {
    initializeMap();
  }

  // Update the map when sensor or level changes.
  currentData.subscribe(_ => {
    try {
      // console.log('currentData');
      // console.log($currentDate, $currentSensor, $currentLevel);
      // console.log(_);
      // console.log('updating map due to currentData change');
      updateMap('data');
    } catch (err) {
      ////console.log(err);
    }
  });
  currentLevel.subscribe(_ => {
    try {
      // console.log('currentLevel');
      updateMap('data');
    } catch (err) {
      ////console.log(err);
    }
  });
  currentDate.subscribe(_ => {
    try {
      // console.log('currentDate');
      // console.log($currentDate, $currentSensor, $currentLevel);
      // console.log($currentData);
      if (
        $currentData.length > 0 &&
        ($currentData[0].sensor !== $currentSensor || $currentData[0].level !== $currentLevel)
      ) {
        return;
      }
      // console.log('updating map due to currentDate change');
      updateMap('data');
    } catch (err) {
      ////console.log(err);
    }
  });
  signalType.subscribe(_ => {
    try {
      // console.log('signal');
      updateMap('signal');
    } catch (err) {
      ////console.log(err);
    }
  });

  mounted.subscribe(_ => {
    try {
      updateMap('mounted');
    } catch (err) {
      ////console.log(err);
    }
  });

  function updateMap(type) {
    if (!mapMounted) return;

    Object.keys($levels).forEach(level => map && map.removeFeatureState({ source: level }));

    // if (type === 'data') {
    //   map.getLayer($currentLevel) && map.removeLayer($currentLevel);
    // }

    let thisMeta = $metaData.find(d => d.data_source === $currentSensor && d.geo_type === $currentLevel);
    let sts = $stats.get($currentSensor);
    let valueMinMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];

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
      if (geoIds.has(id) && valueMappedVals.get(id) !== undefined) {
        d.properties.value = valueMappedVals.get(id);
      }
      if (geoIds.has(id) && directionMappedVals.get(id) !== undefined) {
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
        }
      } else {
        map.getLayer(name) && map.setLayoutProperty(name, 'visibility', 'none');
      }
    });

    const viableFeatures = dat.features.filter(f => f.properties[$signalType] !== -100);

    // set a random focus on start up
    if (chosenRandom === false && $mounted) {
      if (viableFeatures.length > 0) {
        const found = viableFeatures.filter(
          f => f.properties.id === '42003' || f.properties.id === '38300' || f.properties.id === 'PA',
        );
        if (found.length > 0) {
          // found allegheny / Pittsburgh
          const randomFeature = found[0];
          ////console.log(randomFeature);
          currentRegionName.set(randomFeature.properties.NAME);
          currentRegion.set(randomFeature.properties.id);
          clickedId = randomFeature.id;
          map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: true });
          chosenRandom = true;
        } else {
          const index = Math.floor(Math.random() * (viableFeatures.length - 1));
          ////console.log(dat.features);
          ////console.log(viableFeatures, viableFeatures.length, index);
          const randomFeature = viableFeatures[index];
          ////console.log(randomFeature);
          ////console.log(randomFeature.properties.NAME);
          currentRegionName.set(randomFeature.properties.NAME);
          currentRegion.set(randomFeature.properties.id);
          clickedId = randomFeature.id;
          map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: true });
          chosenRandom = true;
        }
      }
    }

    ////console.log($currentRegion);
    ////console.log(viableFeatures.filter(f => f.properties.id === $currentRegion).length);
    if ($currentRegion) {
      const found = viableFeatures.filter(f => f.properties.id === $currentRegion);
      if (found.length > 0) {
        clickedId = found[0].id;
        ////console.log('clickedId', clickedId);
        map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: true });
      } else {
        clickedId = null;
        currentRegion.set('');
        currentRegionName.set('');
        ////console.log('no current region');
      }
    }
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

    map.on(
      'render',
      debounce(ev => {
        currentDataReadyOnMay.set(true);
      }, 150),
    );

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
        ////console.log(data);
        map.addLayer({
          id: `${name}-hover`,
          source: name,
          type: 'line',
          paint: {
            'line-color': MAP_THEME.hoverRegionOutline,
            'line-width': ['case', ['any', ['boolean', ['feature-state', 'hover'], false]], 4, 0],
          },
        });

        map.addLayer({
          id: `${name}-selected`,
          source: name,
          type: 'line',
          paint: {
            'line-color': MAP_THEME.selectedRegionOutline,
            'line-width': ['case', ['any', ['boolean', ['feature-state', 'select'], false]], 4, 0],
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

      Object.keys($levels).forEach(name => {
        map.addLayer(
          {
            id: name,
            source: name,
            type: 'fill',
            visibility: 'none',
            filter: ['!=', $signalType, -100],
            paint: {
              'fill-outline-color': '#616161',
              'fill-color': MAP_THEME.countyFill,
            },
          },
          `${name}-hover`,
        );
      });

      mapMounted = true;
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
    min-height: 550px;
  }

  .state-buttons-holder {
    position: absolute;
    top: 79px;
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
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    padding: 0;
    box-sizing: content-box;
    background-color: white;
    border: 1px solid #d5d5d5;
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
