<script>
  import { onMount } from 'svelte';
  import colorParse from 'color-parse';
  import invertColor from 'invert-color';
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
    currentDataReadyOnMap,
    metaData,
    mounted,
    mapFirstLoaded,
  } from './stores.js';
  import { defaultRegionOnStartup } from './util.js';
  import { DIRECTION_THEME, MAP_THEME } from './theme.js';

  let LAT = -0.5;
  let LON = -0.5;
  let ZOOM = 3.9;

  let container;
  let map;
  let popup;
  let hoveredId = null;
  let megaHoveredId;
  let clickedId;
  let megaClickedId;

  // Boolean tracking if the map has been initialized.
  let mapMounted = false;
  let chosenRandom = false;

  function getTextColorBasedOnBackground(bgColor) {
    // https://github.com/onury/invert-color
    return invertColor(colorParse(bgColor).values, { black: '#000', white: '#fff', threshold: 0.32 });
  }

  onMount(_ => {
    let containerWidth = container.clientWidth;
    if (containerWidth <= 1021) {
      ZOOM = 3.9;
    } else if (containerWidth > 1021 && containerWidth < 1280) {
      ZOOM = 4.1;
    } else if (containerWidth >= 1280) {
      ZOOM = 4.3;
    }
  });

  // Mouse event handlers
  const onMouseEnter = level => e => {
    map.getCanvas().style.cursor = 'pointer';
    popup.setLngLat(e.lngLat).addTo(map);
  };

  const onMouseMove = level => e => {
    if (level === 'state-outline') {
      map.getCanvas().style.cursor = 'pointer';
      popup
        .setLngLat(e.lngLat)
        .setHTML('Estimate unavailable')
        .addTo(map);
      return;
    }
    map.setFeatureState({ source: level }, { hover: false });
    map.setFeatureState({ source: 'mega-county' }, { hover: false });
    if (level !== 'mega-county') {
      if (hoveredId !== e.features[0].id) {
        map.setFeatureState({ source: level, id: hoveredId }, { hover: false });
        map.setFeatureState({ source: level, id: megaHoveredId }, { hover: false });
      }

      hoveredId = e.features[0].id;
      map.setFeatureState({ source: level, id: hoveredId }, { hover: true });
    } else {
      map.setFeatureState({ source: level, id: megaHoveredId }, { hover: false });
      // console.log(hoveredId);
      if (hoveredId === null) {
        if (megaHoveredId !== e.features[0].id) {
          map.setFeatureState({ source: level, id: megaHoveredId }, { hover: false });
        }

        megaHoveredId = e.features[0].id;
        map.setFeatureState({ source: level, id: megaHoveredId }, { hover: true });
      } else {
        map.setFeatureState({ source: level, id: megaHoveredId }, { hover: false });
        megaHoveredId = null;
      }
    }

    if (hoveredId !== null && level === 'mega-county') return;

    // popup
    const { value, direction, NAME } = e.features[0].properties;
    const fillColor = e.features[0].layer.paint['fill-color'].toString();
    var title = `
      <div class="map-popup-region-name">
      ${level === 'mega-county' ? 'Rest of' : ''}
      ${NAME} ${$currentLevel === 'county' && level !== 'mega-county' ? 'County' : ''} ${
      $currentLevel === 'msa' ? 'Metro Area' : ''
    }
      </div>
      <div class="map-popup-region-value-container">
        ${
          $signalType === 'value'
            ? $currentSensor === 'ght'
              ? 'Relative Frequency: <span class="map-popup-region-value" style="background-color: ' +
                fillColor +
                '; color: ' +
                getTextColorBasedOnBackground(fillColor) +
                ';">' +
                value.toFixed(2) +
                '</span>'
              : $currentSensor === 'quidel'
              ? 'Tests per Device: <span class="map-popup-region-value" style="background-color: ' +
                fillColor +
                '; color: ' +
                getTextColorBasedOnBackground(fillColor) +
                ';">' +
                value.toFixed(2) +
                '</span>'
              : 'Percentage: <span class="map-popup-region-value" style="background-color: ' +
                fillColor +
                '; color: ' +
                getTextColorBasedOnBackground(fillColor) +
                ';">' +
                value.toFixed(2) +
                '%</span>'
            : ''
        }
        ${
          $signalType === 'direction'
            ? '7-day Trend: ' +
              (direction === 1
                ? '<span class="map-popup-region-value" style="background-color: ' +
                  DIRECTION_THEME.increasing +
                  '; color: ' +
                  getTextColorBasedOnBackground(DIRECTION_THEME.increasing) +
                  '">' +
                  DIRECTION_THEME.increasingIcon +
                  ' Increasing</span>'
                : direction === -1
                ? '<span class="map-popup-region-value" style="background-color: ' +
                  DIRECTION_THEME.decreasing +
                  '; color: ' +
                  getTextColorBasedOnBackground(DIRECTION_THEME.decreasing) +
                  '">' +
                  DIRECTION_THEME.decreasingIcon +
                  ' Decreasing</span>'
                : direction === 0
                ? '<span class="map-popup-region-value" style="background-color: ' +
                  DIRECTION_THEME.steady +
                  '; color: ' +
                  getTextColorBasedOnBackground(DIRECTION_THEME.steady) +
                  '">' +
                  DIRECTION_THEME.steadyIcon +
                  ' Steady</span>'
                : '<span class="map-popup-region-value">n/a</span>')
            : ''
        }
      </div>
    `;
    popup
      .setLngLat(e.lngLat)
      .setHTML(title)
      .addTo(map);
  };

  const onMouseLeave = level => e => {
    if (level === 'state-outline') {
      popup.remove();
      return;
    }
    map.setFeatureState({ source: 'mega-county', id: megaHoveredId }, { hover: false });
    if (level === 'mega-county' && hoveredId !== null) megaHoveredId = null;
    map.setFeatureState({ source: level, id: hoveredId }, { hover: false });
    if (level !== 'mega-county') hoveredId = null;

    map.getCanvas().style.cursor = '';
    popup.remove();
  };

  const onClick = level => e => {
    if (clickedId) {
      map.setFeatureState({ source: level, id: clickedId }, { select: false });
    }
    if (megaClickedId) {
      map.setFeatureState({ source: level, id: megaClickedId }, { select: false });
    }

    if (level === 'mega-county') {
      if (hoveredId !== null) return;
      map.setFeatureState({ source: 'county', id: clickedId }, { select: false });
      clickedId = null;
      if (megaClickedId !== e.features[0].id) {
        megaClickedId = e.features[0].id;
        map.setFeatureState({ source: level, id: megaClickedId }, { select: true });
        currentRegionName.set(e.features[0].properties.NAME);
        currentRegion.set(e.features[0].properties.STATE + '000');
      } else {
        megaClickedId = null;
        currentRegionName.set('');
        currentRegion.set('');
      }
    } else {
      if (clickedId !== e.features[0].id) {
        clickedId = e.features[0].id;
        map.setFeatureState({ source: level, id: clickedId }, { select: true });
        currentRegionName.set(e.features[0].properties.NAME);
        currentRegion.set(e.features[0].properties.id);
      } else {
        clickedId = null;
        currentRegionName.set('');
        currentRegion.set('');
      }
    }
  };

  // If it hasn't been initialized and we have geojsons and initial data, create map.
  $: if (!map && $geojsons.size !== 0 && $metaData.length !== 0 && $stats) {
    initializeMap();
  }

  // Update the map when sensor or level changes.
  currentData.subscribe(_ => updateMap('data'));
  currentLevel.subscribe(_ => updateMap('data'));
  signalType.subscribe(_ => updateMap('signal'));
  mounted.subscribe(_ => updateMap('mounted'));
  currentDate.subscribe(_ => {
    if (
      $currentData.length > 0 &&
      ($currentData[0].sensor !== $currentSensor || $currentData[0].level !== $currentLevel)
    ) {
      return;
    }
    updateMap('data');
  });

  function updateMap(type) {
    if (!mapMounted) return;

    // Reset all hover/click states.
    [...Object.keys($levels), 'mega-county'].forEach(level => map && map.removeFeatureState({ source: level }));

    // If we're lookinga t counties, draw the mega-county states.
    let drawMega = $currentLevel === 'county';

    // Get the range for the heatmap.
    let thisMeta = $metaData.find(d => d.data_source === $currentSensor && d.geo_type === $currentLevel);
    let thisStats = $stats.get($currentSensor);
    let valueMinMax = [thisStats.mean - 3 * thisStats.std, thisStats.mean + 3 * thisStats.std];
    currentRange.set($signalType === 'value' ? valueMinMax : [-1, 1]);

    let valueMappedVals = new Map();
    let directionMappedVals = new Map();
    let valueMappedMega = new Map();
    let directionMappedMega = new Map();

    // Get the GEO_IDS and value/directions from the API data, including mega counties if necessary.
    let geoIds = new Set(
      $currentData.map(d => {
        const key = d.geo_value.toUpperCase();
        const megaIndicator = key.slice(-3) + '';
        const megaKey = key.slice(0, 2) + '';

        if (d.value !== null) {
          if (drawMega && megaIndicator === '000') {
            valueMappedMega.set(megaKey, d.value);
          } else {
            valueMappedVals.set(key, d.value);
          }
        }
        if (d.direction !== null) {
          if (drawMega && megaIndicator === '000') {
            directionMappedMega.set(megaKey, d.direction);
          } else {
            directionMappedVals.set(key, d.direction);
          }
        }
        return key;
      }),
    );

    let megaDat = $geojsons.get('state');
    if (drawMega) {
      megaDat.features.forEach(d => {
        const id = d.properties.STATE;

        d.properties.value = -100;
        d.properties.direction = -100;
        if (geoIds.has(id + '000') && valueMappedMega.get(id) !== undefined) {
          d.properties.value = valueMappedMega.get(id);
        }
        if (geoIds.has(id + '000') && directionMappedMega.get(id) !== undefined) {
          d.properties.direction = directionMappedMega.get(id);
        }
      });
    }

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
    let stopsMega;
    if ($signalType === 'value') {
      let center = valueMinMax[0] + (valueMinMax[1] - valueMinMax[0]) / 2;
      stops = [
        [Math.max(0, valueMinMax[0]), DIRECTION_THEME.gradientMin],
        [center, DIRECTION_THEME.gradientMiddle],
        [valueMinMax[1], DIRECTION_THEME.gradientMax],
      ];
      stopsMega = [
        [Math.max(0, valueMinMax[0]), DIRECTION_THEME.gradientMinMega],
        [center, DIRECTION_THEME.gradientMiddleMega],
        [valueMinMax[1], DIRECTION_THEME.gradientMaxMega],
      ];
    } else {
      stops = [
        [-100, MAP_THEME.countyFill],
        [-1, DIRECTION_THEME.decreasing],
        [0, DIRECTION_THEME.steady],
        [1, DIRECTION_THEME.increasing],
      ];
      stopsMega = [
        [-100, MAP_THEME.countyFill],
        [-1, DIRECTION_THEME.gradientMinMega],
        [0, DIRECTION_THEME.gradientMiddleMega],
        [1, DIRECTION_THEME.gradientMaxMega],
      ];
    }

    if (['data', 'init'].includes(type)) {
      map.getSource($currentLevel).setData(dat);
      drawMega ? map.getSource('mega-county').setData(megaDat) : '';
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
    if (drawMega) {
      map.setPaintProperty('mega-county', 'fill-color', {
        property: $signalType,
        stops: stopsMega,
      });
      map.setLayoutProperty('mega-county', 'visibility', 'visible');
    } else {
      map.setLayoutProperty('mega-county', 'visibility', 'none');
    }

    const viableFeatures = dat.features.filter(f => f.properties[$signalType] !== -100);

    // set a random focus on start up
    if (chosenRandom === false && $mounted) {
      if (viableFeatures.length > 0) {
        const found = viableFeatures.filter(
          f =>
            f.properties.id === defaultRegionOnStartup.county ||
            f.properties.id === defaultRegionOnStartup.msa ||
            f.properties.id === defaultRegionOnStartup.state,
        );
        if (found.length > 0) {
          // found Allegheny / Pittsburgh
          const randomFeature = found[0];
          if ($currentRegion === '') {
            currentRegionName.set(randomFeature.NAME);
            currentRegion.set(randomFeature.id);
          }
          chosenRandom = true;
        } else {
          const index = Math.floor(Math.random() * (viableFeatures.length - 1));
          const randomFeature = viableFeatures[index];
          currentRegionName.set(randomFeature.properties.NAME);
          currentRegion.set(randomFeature.properties.id);
          clickedId = randomFeature.id;
          map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: true });
          chosenRandom = true;
        }
      }
    }

    if ($currentRegion) {
      const megaFound = megaDat.features.filter(f => f.properties.STATE + '000' === $currentRegion + '');
      const found = viableFeatures.filter(f => f.properties.id === $currentRegion);
      if (megaFound.length > 0) {
        megaClickedId = parseInt(megaFound[0].properties.STATE);
        map.setFeatureState({ source: 'mega-county', id: megaClickedId }, { select: true });
      }
      if (found.length > 0) {
        clickedId = found[0].id;
        map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: true });
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
      minZoom: ZOOM - 1,
    })
      .addControl(new mapboxgl.AttributionControl({ compact: true }))
      .addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    //Disable touch zoom, it makes gesture scrolling difficult
    map.scrollZoom.disable();

    popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'map-popup',
    });
    map.on('mousemove', 'state-outline', onMouseMove('state-outline'));
    [...Object.keys($levels), 'mega-county'].forEach(level => {
      map.on('mouseenter', level, onMouseEnter(level));
      map.on('mousemove', level, onMouseMove(level));
      map.on('mouseleave', level, onMouseLeave(level));
      map.on('click', level, onClick(level));
    });

    map.on('idle', ev => {
      currentDataReadyOnMap.set(true);
      mapFirstLoaded.set(true);
    });

    map.on('error', ev => {
      mapFirstLoaded.set(true);
    });

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
      });
      map.addSource('mega-county', {
        type: 'geojson',
        data: $geojsons.get('state'),
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
      });

      ['mega-county', ...Object.keys($levels)].forEach(name => {
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
        filter: ['>', 'population', 900000],
        maxzoom: 4,
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
        id: 'city-point-unclustered-2',
        source: 'city-point',
        type: 'symbol',
        filter: ['>', 'population', 500000],
        maxzoom: 6,
        minzoom: 4,
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
        id: 'city-point-unclustered-3',
        source: 'city-point',
        type: 'symbol',
        filter: ['>', 'population', 100000],
        maxzoom: 8,
        minzoom: 6,
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
        id: 'city-point-unclustered-4',
        source: 'city-point',
        type: 'symbol',
        minzoom: 8,
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

      map.addLayer(
        {
          id: 'mega-county',
          source: 'mega-county',
          type: 'fill',
          visibility: 'none',
          filter: ['!=', $signalType, -100],
          paint: {
            'fill-outline-color': '#616161',
            'fill-color': MAP_THEME.countyFill,
          },
        },
        `mega-county-hover`,
      );

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
      on:click={_ => map.easeTo({ center: [LON, LAT], zoom: ZOOM, bearing: 0, pitch: 0 })}>
      <img src="./assets/imgs/us48.png" alt="" />
    </button>
  </div>
</div>
