<script>
  import mapboxgl from 'mapbox-gl';
  import { onMount } from 'svelte';
  import { defaultRegionOnStartup, getTextColorBasedOnBackground } from './util.js';
  import { DIRECTION_THEME, MAP_THEME } from './theme.js';
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
    mounted,
    mapFirstLoaded,
    sensorMap,
  } from './stores.js';
  import * as d3 from 'd3';

  let LAT = -0.5;
  let LON = -0.5;
  let ZOOM = 3.9;

  // Boolean tracking if the map has been initialized.
  let mapMounted = false;
  let chosenRandom = false;
  let hoveredId = null;
  let container;
  let map;
  let popup;
  let megaHoveredId;
  let clickedId;
  let megaClickedId;

  onMount(_ => {
    let containerWidth = container.clientWidth;
    if (containerWidth <= 1021) {
      //ZOOM = 3.9;
      ZOOM = containerWidth / 300;
    } else if (containerWidth > 1021 && containerWidth < 1280) {
      //ZOOM = 4.1;
      ZOOM = containerWidth / 330;
    } else if (containerWidth >= 1280) {
      //ZOOM = 4.3;
      ZOOM = Math.min(4.3, containerWidth / 350);
    }
  });

  // Mouse event handlers
  const onMouseEnter = level => e => {
    map.getCanvas().style.cursor = 'pointer';
    popup.setLngLat(e.lngLat).addTo(map);

    map.setFeatureState({ source: level, id: hoveredId }, { hover: false });
    map.setFeatureState({ source: 'mega-county', id: megaHoveredId }, { hover: false });
  };

  const onMouseMove = level => e => {
    if (level === 'state-outline') {
      map.getCanvas().style.cursor = 'pointer';
      popup
        .setLngLat(e.lngLat)
        .setHTML('Estimate unavailable for rest of ' + e.features[0].properties.NAME)
        .addTo(map);
      return;
    }

    map.setFeatureState({ source: level, id: hoveredId }, { hover: false });
    map.setFeatureState({ source: 'mega-county', id: megaHoveredId }, { hover: false });

    var fillColor;
    if (level === 'mega-county') {
      if (hoveredId === null) {
        megaHoveredId = e.features[0].id;
        map.setFeatureState({ source: level, id: megaHoveredId }, { hover: true });
        // get hover color for mega county
        var color_stops = map.getLayer(level).getPaintProperty('fill-color')['stops'];
        var value_range = [];
        var color_range = [];
        for (var i = 0; i < color_stops.length; i++) {
          value_range.push(color_stops[i][0]);
          color_range.push(color_stops[i][1].match(/\d+(\.\d{1,2})?/g));
        }
        var ramp = d3
          .scaleLinear()
          .domain(value_range)
          .range(color_range);
        ramp.clamp(true);

        const value = e.features[0].properties.value;
        var arr = ramp(value);
        fillColor = 'rgba(' + arr.join(', ') + ')';
      } else {
        megaHoveredId = null;
      }
    } else {
      hoveredId = e.features[0].id;
      map.setFeatureState({ source: level, id: hoveredId }, { hover: true });

      //get hover color for regular county
      var color_stops = map.getLayer(level).getPaintProperty('fill-color')['stops'];
      var value_range = [];
      var color_range = [];
      for (var i = 0; i < color_stops.length; i++) {
        value_range.push(color_stops[i][0]);
        color_range.push(color_stops[i][1].match(/\d+/g));
      }
      var ramp = d3
        .scaleLinear()
        .domain(value_range)
        .range(color_range);
      ramp.clamp(true);

      const value = e.features[0].properties.value;
      var arr = ramp(value);
      fillColor = 'rgb(' + arr.join(', ') + ')';

      /*
      var value_range = [color_stops[0][0], color_stops[color_stops.length - 1][0]];

      const logScale = d3.scaleSymlog().domain(value_range);
      const colorScaleLog = d3.scaleSequential(d => d3.interpolateYlOrRd(logScale(d)));

      const value = e.features[0].properties.value;
      var arr = colorScaleLog(value);
      fillColor = arr;
      */
    }

    if (hoveredId !== null && level === 'mega-county') return;
    // popup
    const { value, direction, NAME, Population } = e.features[0].properties;
    //const fillColor = e.features[0].layer.paint['fill-color'].toString();

    const sens = $sensorMap.get($currentSensor);
    let title =
      (level === 'mega-county' ? 'Rest of ' : '') +
      NAME +
      ($currentLevel === 'county' && level !== 'mega-county' ? ' County' : '');

    let body;
    if ($signalType === 'value') {
      // More information displayed when counts is shown
      if ($currentSensor.match(/deaths_incidence_num/)) {
        const death_num = e.features[0].properties.value;
        const ratio = e.features[0].properties.value1;
        body = `
          <div class="map-popup-region-value-container">
            Population: ${Population} <br>
            Death per 100,000 people: ${ratio.toFixed(2)} ${sens.format === 'percent' ? '%' : ''} <br>
            ${sens.yAxis}:
            <span class="map-popup-region-value" 
                  style="background-color: ${fillColor}; 
                        color: ${getTextColorBasedOnBackground(fillColor)};">
              ${death_num}
            </span>
            
          </div>
        `;
      } else if ($currentSensor.match(/deaths_incidence_prop/)) {
        const death_num = e.features[0].properties.value1;
        const ratio = e.features[0].properties.value;
        body = `
          <div class="map-popup-region-value-container">
            Population: ${Population} <br>
            Deaths: ${death_num} <br>
            ${sens.yAxis}:
            <span class="map-popup-region-value" 
                  style="background-color: ${fillColor}; 
                        color: ${getTextColorBasedOnBackground(fillColor)};">
              ${ratio.toFixed(2)}
              ${sens.format === 'percent' ? '%' : ''}
            </span>
          </div>
        `;
      } else if ($currentSensor.match(/confirmed_incidence_num/)) {
        const cases_num = e.features[0].properties.value;
        const ratio = e.features[0].properties.value1;
        body = `
          <div class="map-popup-region-value-container">
            Population: ${Population} <br>
            Cases per 100,000 people: ${ratio.toFixed(2)} ${sens.format === 'percent' ? '%' : ''} <br>
            ${sens.yAxis}:
            <span class="map-popup-region-value" 
                  style="background-color: ${fillColor}; 
                        color: ${getTextColorBasedOnBackground(fillColor)};">
              ${cases_num}
            </span>
            
          </div>
        `;
      } else if ($currentSensor.match(/confirmed_incidence_prop/)) {
        const cases_num = e.features[0].properties.value1;
        const ratio = e.features[0].properties.value;
        body = `
          <div class="map-popup-region-value-container">
            Population: ${Population} <br>
            Cases: ${cases_num} <br>
            ${sens.yAxis}:
            <span class="map-popup-region-value" 
                  style="background-color: ${fillColor}; 
                        color: ${getTextColorBasedOnBackground(fillColor)};">
              ${ratio.toFixed(2)}
              ${sens.format === 'percent' ? '%' : ''}
            </span>
          </div>
        `;
      } else {
        body = `
          <div class="map-popup-region-value-container">
            ${sens.yAxis}:
            <span class="map-popup-region-value" 
                  style="background-color: ${fillColor}; 
                        color: ${getTextColorBasedOnBackground(fillColor)};">
              ${value.toFixed(2)}
              ${sens.format === 'percent' ? '%' : ''}
            </span>
          </div>
        `;
      }
    } else {
      let color, icon, text;
      if (direction === 1) {
        color = DIRECTION_THEME.increasing;
        icon = DIRECTION_THEME.increasingIcon;
        text = 'Increasing';
      } else if (direction === 0) {
        color = DIRECTION_THEME.steady;
        icon = DIRECTION_THEME.steadyIcon;
        text = 'Steady';
      } else {
        color = DIRECTION_THEME.decreasing;
        icon = DIRECTION_THEME.decreasingIcon;
        text = 'Decreasing';
      }

      body = `<div class="map-popup-region-value-container">
                <span class="map-popup-region-value" 
                      style="background-color: ${color};
                      color: 
                      ${getTextColorBasedOnBackground(color)};">
                  ${icon} ${text} 
                </span>
               </div>`;
    }

    body =
      `<div class="map-popup-region-name">
        ${title}
      </div>` + body;

    popup
      .setLngLat(e.lngLat)
      .setHTML(body)
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
      map.setFeatureState({ source: 'mega-county', id: megaClickedId }, { select: false });
    }

    if (level === 'mega-county') {
      if (hoveredId !== null) return;
      if (megaHoveredId === megaClickedId) {
        megaClickedId = null;
        currentRegionName.set('');
        currentRegion.set('');
        return;
      }
      map.setFeatureState({ source: 'county', id: clickedId }, { select: false });
      clickedId = null;
      megaClickedId = e.features[0].id;
      map.setFeatureState({ source: level, id: megaClickedId }, { select: true });
      currentRegionName.set(e.features[0].properties.NAME);
      currentRegion.set(e.features[0].properties.STATE + '000');
    } else {
      megaClickedId = null;
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
  $: if (!map && $geojsons.size !== 0 && $stats) {
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

    // If we're looking at counties, draw the mega-county states.
    let drawMega = $currentLevel === 'county';

    // Get the range for the heatmap.
    let thisStats;
    let valueMinMax;

    // Customize min max values for deaths
    if ($currentSensor.match(/num/)) {
      thisStats = $stats.get($currentSensor + '_' + $currentLevel);
      valueMinMax = [Math.max(0.01, thisStats.mean - 3 * thisStats.std), thisStats.mean + 3 * thisStats.std];
    } else {
      thisStats = $stats.get($currentSensor);
      valueMinMax = [thisStats.mean - 3 * thisStats.std, thisStats.mean + 3 * thisStats.std];
    }

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
          var info;
          if ($currentSensor.match(/prop/) || $currentSensor.match(/num/)) {
            info = [d.count, d.ratio];
          } else {
            info = [d.value];
          }
          if (drawMega && megaIndicator === '000') {
            valueMappedMega.set(megaKey, info);
          } else {
            valueMappedVals.set(key, info);
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
          d.properties.value = valueMappedMega.get(id)[0];

          if ($currentSensor.match(/num/)) {
            d.properties.value = valueMappedMega.get(id)[0];
            d.properties.value1 = valueMappedMega.get(id)[1];
          } else if ($currentSensor.match(/prop/)) {
            d.properties.value = valueMappedMega.get(id)[1];
            d.properties.value1 = valueMappedMega.get(id)[0];
          }
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
        d.properties.value = valueMappedVals.get(id)[0];
        if ($currentSensor.match(/num/)) {
          d.properties.value = valueMappedVals.get(id)[0];
          d.properties.value1 = valueMappedVals.get(id)[1];
        } else if ($currentSensor.match(/prop/)) {
          d.properties.value = valueMappedVals.get(id)[1];
          d.properties.value1 = valueMappedVals.get(id)[0];
        }
      }
      if (geoIds.has(id) && directionMappedVals.get(id) !== undefined) {
        d.properties.direction = directionMappedVals.get(id);
      }
    });

    let stops;
    let stopsMega;
    if ($signalType === 'value') {
      valueMinMax[0] = Math.max(0, valueMinMax[0]);
      let center = valueMinMax[0] + (valueMinMax[1] - valueMinMax[0]) / 2;

      if ($currentSensor.match(/num/) || $currentSensor.match(/prop/)) {
        valueMinMax[0] = Math.max(valueMinMax[0], 1);
        stops = [
          [0, DIRECTION_THEME.countMin],
          [valueMinMax[0], DIRECTION_THEME.gradientMin],
          [center, DIRECTION_THEME.gradientMiddle],
          [valueMinMax[1], DIRECTION_THEME.gradientMax],
        ];
        stopsMega = [
          [0, DIRECTION_THEME.countMin],
          [valueMinMax[0], DIRECTION_THEME.gradientMinMega],
          [center, DIRECTION_THEME.gradientMiddleMega],
          [valueMinMax[1], DIRECTION_THEME.gradientMaxMega],
        ];
      } else {
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
      }
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
            currentRegionName.set(randomFeature.properties.NAME);
            currentRegion.set(randomFeature.id);
            clickedId = randomFeature.id;
            map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: true });
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
        currentRegionName.set(megaFound[0].properties.NAME);
        map.setFeatureState({ source: 'mega-county', id: megaClickedId }, { select: true });
      }
      if (found.length > 0) {
        clickedId = found[0].id;
        currentRegionName.set(found[0].properties.NAME);
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
    map.on('mouseleave', 'state-outline', onMouseLeave('state-outline'));
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
          'text-halo-width': 0,
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
          'text-halo-width': 0,
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
          'text-halo-width': 0,
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
          'text-halo-width': 02,
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
            'fill-outline-color': MAP_THEME.countyOutlineWhenFilled,
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
              'fill-outline-color': MAP_THEME.countyOutlineWhenFilled,
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
