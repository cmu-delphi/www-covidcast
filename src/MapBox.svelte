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
    currentDataReadyOnMay,
    metaData,
    sensors,
    mounted,
    mapfirstLoaded,
  } from './stores.js';
  import { DIRECTION_THEME, MAP_THEME } from './theme.js';

  let LAT = -1.2;
  let LON = -0.5;
  let ZOOM = 3.9; // should be set to 4.3 as default

  let container;
  let map;
  let popup;
  let hoveredId = null;
  let megaHoveredId;
  let clickedId;
  let megaClickedId;

  /*
  bgColor:string - 'rgb(xx,yy,zz)'
*/
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

  // Boolean tracking if the map has been initialized.
  let mapMounted = false;
  let chosenRandom = false;

  // Mouse event handlers
  const onMouseEnter = level => e => {
    // popup
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
      console.log(hoveredId);
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
    hoveredId = null;

    map.getCanvas().style.cursor = '';
    popup.remove();
  };

  const onClick = level => e => {
    // If we've clicked on a county, don't select the mega county;
    // console.log(hoveredId, clickedId, megaHoveredId, megaClickedId);
    // if (level === 'mega-county' && hoveredId !== null) return;

    if (clickedId) {
      map.setFeatureState({ source: level, id: clickedId }, { select: false });
    }
    if (megaClickedId) {
      map.setFeatureState({ source: level, id: megaClickedId }, { select: false });
    }

    if (level === 'mega-county') {
      console.log('hoveredId', hoveredId, 'clickedId', clickedId);
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

    let drawMega = $currentLevel === 'county';

    Object.keys($levels).forEach(level => map && map.removeFeatureState({ source: level }));
    map.removeFeatureState({ source: 'mega-county' });

    // if (type === 'data') {
    //   map.getLayer($currentLevel) && map.removeLayer($currentLevel);
    // }

    let thisMeta = $metaData.find(d => d.data_source === $currentSensor && d.geo_type === $currentLevel);
    let sts = $stats.get($currentSensor);
    let valueMinMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];

    let valueMappedVals = new Map();
    let directionMappedVals = new Map();
    let valueMappedMega = new Map();
    let directionMappedMega = new Map();

    let geoIds = new Set(
      $currentData.map(d => {
        const key = d.geo_value.toUpperCase();

        if (d.value !== null) {
          if (drawMega && key.slice(-3) + '' === '000') {
            valueMappedMega.set(key.slice(0, 2) + '', d.value);
          } else {
            valueMappedVals.set(key, d.value);
          }
        }
        if (d.direction !== null) {
          if (drawMega && key.slice(-3) + '' === '000') {
            directionMappedMega.set(key.slice(0, 2) + '', d.direction);
          } else {
            directionMappedVals.set(key, d.direction);
          }
        }

        return key;
      }),
    );

    currentRange.set($signalType === 'value' ? valueMinMax : [-1, 1]);

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
      console.log(megaDat.features.map(d => d.properties.direction));
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
        [valueMinMax[0], DIRECTION_THEME.gradientMin],
        [center, DIRECTION_THEME.gradientMiddle],
        [valueMinMax[1], DIRECTION_THEME.gradientMax],
      ];
      stopsMega = [
        [valueMinMax[0], DIRECTION_THEME.gradientMinMega],
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
    console.log(map.getStyle().layers);

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
        // if ($currentLevel === 'county')
        //   map.setFeatureState({ source: 'mega-county', id: megaClickedId }, { select: true });
      } else {
        clickedId = null;
        // if ($currentLevel === 'county') megaClickedId = null;
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
      minZoom: ZOOM - 1,
    })
      .addControl(new mapboxgl.AttributionControl({ compact: true }))
      .addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('idle', ev => {
      currentDataReadyOnMay.set(true);
      mapfirstLoaded.set(true);
    });

    map.on('error', ev => {
      mapfirstLoaded.set(true);
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
      map.addLayer({
        id: `mega-county-hover`,
        source: 'mega-county',
        type: 'line',
        paint: {
          'line-color': MAP_THEME.hoverRegionOutline,
          'line-width': ['case', ['any', ['boolean', ['feature-state', 'hover'], false]], 4, 0],
        },
      });

      map.addLayer({
        id: `mega-county-selected`,
        source: 'mega-county',
        type: 'line',
        paint: {
          'line-color': MAP_THEME.selectedRegionOutline,
          'line-width': ['case', ['any', ['boolean', ['feature-state', 'select'], false]], 4, 0],
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
        filter: ['>', 'population', 250000],
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
      // map.addLayer({
      //   id: 'city-point-clustered',
      //   source: 'city-point',
      //   type: 'symbol',
      //   filter: ['has', 'point_count'],
      //   layout: {
      //     'text-field': ['get', 'city', ['get', 'largest']],
      //     'text-font': ['Open Sans Regular'],
      //     'text-size': 12,
      //   },
      //   paint: {
      //     'text-halo-color': '#fff',
      //     'text-halo-width': 2,
      //   },
      // });
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
