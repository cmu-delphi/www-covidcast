<script>
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import { getTextColorBasedOnBackground, logScale } from '../util';
  import { DIRECTION_THEME, MAP_THEME, ENCODING_BUBBLE_THEME } from '../theme';
  import Options from './Options.svelte';
  import Toggle from './Toggle.svelte';
  import Legend from './Legend.svelte';
  import Banner from './Banner.svelte';
  import Search from './Search.svelte';
  import MapControls from './MapControls.svelte';
  import Title from './Title.svelte';
  import Time from './Time.svelte';
  import { computeBounds } from './geoUtils';
  import GraphContainer from './Graph/GraphContainer.svelte';
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
    currentZone,
    signalType,
    encoding,
    currentDataReadyOnMap,
    mounted,
    mapFirstLoaded,
    sensorMap,
    radiusScale,
    dict,
    special_counties,
    defaultRegionOnStartup,
  } from '../stores';
  import * as d3 from 'd3';
  import logspace from 'compute-logspace';

  export let isIE, graphShowStatus, toggleGraphShowStatus;

  let searchErrorComponent;
  let parseTime = d3.timeParse('%Y%m%d');
  let formatTimeWithoutYear = d3.timeFormat('%B %d');

  /**
   * @type {mapboxgl.LngLatBounds}
   */
  let stateBounds = null;
  let stateBoundsOptions = {
    padding: 20, //px
    linear: false,
  };
  let zoneBounds = null;
  let zoneBoundsOptions = {
    padding: 20, //px
    linear: false,
  };
  $: showCurrentZone = $currentZone === 'swpa';

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
  let selectedRegion;

  $: regionList = [];
  $: loaded = false;
  $: invalidSearch = false;

  // given the level (state/msa/county), returns the name of its "centered" source/layer
  function center(level) {
    return `${level}-centers`;
  }

  function centerHighlight(level) {
    return `${level}-centers-highlight`;
  }

  onMount(() => {
    Promise.all([d3.json('./maps/name_id_info.json')]).then(([a]) => {
      regionList = a['all'];
      loaded = true;
    });
  });

  // Mouse event handlers
  const onMouseEnter = (level) => (e) => {
    map.getCanvas().style.cursor = 'pointer';
    popup.setLngLat(e.lngLat).addTo(map);
    map.setFeatureState({ source: level, id: hoveredId }, { hover: false });
    map.setFeatureState({ source: center(level), id: hoveredId }, { hover: false });
    map.setFeatureState({ source: 'mega-county', id: megaHoveredId }, { hover: false });
  };

  const onMouseMove = (level) => (e) => {
    if (level === 'state-outline') {
      map.getCanvas().style.cursor = 'pointer';
      popup
        .setLngLat(e.lngLat)
        .setHTML('Estimate unavailable for rest of ' + e.features[0].properties.NAME)
        .addTo(map);
      return;
    }

    map.setFeatureState({ source: level, id: hoveredId }, { hover: false });
    map.setFeatureState({ source: center(level), id: hoveredId }, { hover: false });
    map.setFeatureState({ source: 'mega-county', id: megaHoveredId }, { hover: false });

    let fillColor;
    if (level === 'mega-county') {
      if (hoveredId === null) {
        megaHoveredId = e.features[0].id;
        map.setFeatureState({ source: level, id: megaHoveredId }, { hover: true });
        // get hover color for mega county
        let colorStops = map.getLayer(level).getPaintProperty('fill-color')['stops'];
        let valueDomain = [];
        let colorRange = [];
        for (let i = 0; i < colorStops.length; i++) {
          valueDomain.push(colorStops[i][0]);
          colorRange.push(colorStops[i][1].match(/\d+(\.\d{1,2})?/g));
        }
        let ramp = d3.scaleLinear().domain(valueDomain).range(colorRange);
        ramp.clamp(true);

        const value = e.features[0].properties.value;
        let arr = ramp(value);
        fillColor = 'rgba(' + arr.join(', ') + ')';
      } else {
        megaHoveredId = null;
      }
    } else {
      hoveredId = e.features[0].id;
      map.setFeatureState({ source: level, id: hoveredId }, { hover: true });
      map.setFeatureState({ source: center(level), id: hoveredId }, { hover: true });

      //get hover color for regular county
      let colorStops = map.getLayer(level).getPaintProperty('fill-color')['stops'];
      if ($encoding === 'bubble') {
        fillColor = 'white';
      } else if ($currentSensor.match(/num/)) {
        let valueDomain = [];
        let colorRange = [];
        for (let i = 0; i < colorStops.length; i++) {
          valueDomain.push(colorStops[i][0]);
          colorRange.push(colorStops[i][1].match(/\d+/g));
        }
        let ramp = d3.scaleLinear().domain(valueDomain).range(colorRange);
        ramp.clamp(true);

        const value = e.features[0].properties.value;
        let arr = ramp(value);
        fillColor = 'rgb(' + arr.join(', ') + ')';
      } else {
        let valueDomain = [];
        let colorRange = [];
        for (let i = 0; i < colorStops.length; i++) {
          valueDomain.push(colorStops[i][0]);
          colorRange.push(colorStops[i][1].match(/\d+/g));
        }

        let ramp = d3.scaleLinear().domain(valueDomain).range(colorRange);
        ramp.clamp(true);

        const value = e.features[0].properties.value;
        let arr = ramp(value);
        fillColor = 'rgb(' + arr.join(', ') + ')';
      }
    }

    if (hoveredId !== null && level === 'mega-county') return;
    // popup
    const { value, direction, NAME, STATE, Population } = e.features[0].properties;

    const date = formatTimeWithoutYear(parseTime($currentDate));
    const sens = $sensorMap.get($currentSensor);
    const popCommas = parseInt(Population).toLocaleString();
    let title = (level === 'mega-county' ? 'Rest of ' : '') + NAME + get_label_specifics(NAME, STATE, level);
    let body;

    if ($signalType === 'value') {
      // More information displayed when counts is shown
      if ($currentSensor.match(/incidence_num/)) {
        const avg = e.features[0].properties.value;
        const count = e.features[0].properties.value1;
        body = `
          <div class="map-popup-region-value-container">
            Population: ${popCommas} <br>
            <u>${sens.yAxis}</u>: <br>
            &emsp; ${date}: ${count} <br>
            &emsp; 7-day avg:
            <span class="map-popup-region-value"
                  style="background-color: ${fillColor};
                        color: ${getTextColorBasedOnBackground(fillColor)};">
              ${parseFloat(avg.toFixed(2)).toLocaleString()}
            </span>

          </div>
        `;
      } else if ($currentSensor.match(/incidence_prop/)) {
        const avg = e.features[0].properties.value;
        const count = e.features[0].properties.value1;
        body = `
          <div class="map-popup-region-value-container">
            Population: ${popCommas} <br>
            <u>${sens.yAxis}</u>: <br>
            &emsp; ${date}: ${count.toFixed(2)} <br>
            &emsp; 7-day avg:
            <span class="map-popup-region-value"
                  style="background-color: ${fillColor};
                        color: ${getTextColorBasedOnBackground(fillColor)};">
              ${parseFloat(avg.toFixed(2)).toLocaleString()}
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
              ${parseFloat(value.toFixed(2)).toLocaleString()}
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

    popup.setLngLat(e.lngLat).setHTML(body).addTo(map);
  };

  const onMouseLeave = (level) => () => {
    if (level === 'state-outline') {
      popup.remove();
      return;
    }
    map.setFeatureState({ source: 'mega-county', id: megaHoveredId }, { hover: false });
    if (level === 'mega-county' && hoveredId !== null) megaHoveredId = null;

    map.setFeatureState({ source: level, id: hoveredId }, { hover: false });
    map.setFeatureState({ source: center(level), id: hoveredId }, { hover: false });

    if (level !== 'mega-county') hoveredId = null;

    map.getCanvas().style.cursor = '';
    popup.remove();
  };

  const onClick = (level) => (e) => {
    if (clickedId) {
      map.setFeatureState({ source: level, id: clickedId }, { select: false });
      map.setFeatureState({ source: center(level), id: clickedId }, { select: false });
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
      map.setFeatureState({ source: center(level), id: megaClickedId }, { select: true });
      currentRegionName.set(e.features[0].properties.NAME);
      currentRegion.set(e.features[0].properties.STATE + '000');
    } else {
      megaClickedId = null;
      if (clickedId !== e.features[0].id) {
        clickedId = e.features[0].id;
        map.setFeatureState({ source: level, id: clickedId }, { select: true });
        map.setFeatureState({ source: center(level), id: clickedId }, { select: true });
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
  currentData.subscribe(() => updateMap('data'));
  currentLevel.subscribe(() => {
    label_states();
    updateMap('data');
  });
  signalType.subscribe(() => updateMap('signal'));
  encoding.subscribe(() => updateMap('encoding'));
  mounted.subscribe(() => updateMap('mounted'));
  currentDate.subscribe(() => {
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
    [...Object.keys($levels), 'mega-county'].forEach((level) => map && map.removeFeatureState({ source: level }));

    // If we're looking at counties, draw the mega-county states.
    let drawMega = $currentLevel === 'county';

    // Get the range for the heatmap.
    let thisStats;
    let valueMinMax;

    // Customize min max values for deaths
    if ($currentSensor.match(/num/)) {
      thisStats = $stats.get($currentSensor + '_' + $currentLevel);
      valueMinMax = [Math.max(0.14, thisStats.mean - 3 * thisStats.std), thisStats.mean + 3 * thisStats.std];
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
      $currentData.map((d) => {
        const key = d.geo_value.toUpperCase();
        const megaIndicator = key.slice(-3) + '';
        const megaKey = key.slice(0, 2) + '';

        if (d.value !== null) {
          let info;
          if ($currentSensor.match(/confirmed/) || $currentSensor.match(/deaths/)) {
            info = [d.avg, d.count];
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
      megaDat.features.forEach((d) => {
        const id = d.properties.STATE;

        d.properties.value = -100;
        d.properties.direction = -100;

        if (geoIds.has(id + '000') && valueMappedMega.get(id) !== undefined) {
          d.properties.value = valueMappedMega.get(id)[0];

          if ($currentSensor.match(/7dav_incidence/)) {
            d.properties.value = valueMappedMega.get(id)[0]; // 7-day avg
            d.properties.value1 = valueMappedMega.get(id)[1]; // count
          }
        }
        if (geoIds.has(id + '000') && directionMappedMega.get(id) !== undefined) {
          d.properties.direction = directionMappedMega.get(id);
        }
      });
    }

    let dat = $geojsons.get($currentLevel);
    let centerDat = $geojsons.get(center($currentLevel));

    // set the value of the chosen sensor to each states/counties
    // dat: data for cholopleth
    // centerDat: data for bubbles
    [dat, centerDat].forEach((ds) => {
      ds.features.forEach((d) => {
        const id = d.properties.id;

        d.properties.value = -100;
        d.properties.direction = -100;
        if (geoIds.has(id) && valueMappedVals.get(id) !== undefined) {
          d.properties.value = valueMappedVals.get(id)[0];

          if ($currentSensor.match(/7dav_incidence/)) {
            d.properties.value = valueMappedVals.get(id)[0];
            d.properties.value1 = valueMappedVals.get(id)[1];
          }
        }
        if (geoIds.has(id) && directionMappedVals.get(id) !== undefined) {
          d.properties.direction = directionMappedVals.get(id);
        }
      });
    });

    let stops, stopsMega, currentRadiusScale;

    if ($signalType === 'value') {
      valueMinMax[0] = Math.max(0, valueMinMax[0]);
      let center = valueMinMax[0] + (valueMinMax[1] - valueMinMax[0]) / 2;
      let firstHalfCenter = valueMinMax[0] + (center - valueMinMax[0]) / 2;
      let secondHalfCenter = center + (valueMinMax[1] - center) / 2;

      let colorScaleLinear = d3.scaleSequential(d3.interpolateYlOrRd).domain([valueMinMax[0], valueMinMax[1]]);

      const c1 = d3.rgb(colorScaleLinear(valueMinMax[0]));
      const c2 = d3.rgb(colorScaleLinear(firstHalfCenter));
      const c3 = d3.rgb(colorScaleLinear(center));
      const c4 = d3.rgb(colorScaleLinear(secondHalfCenter));
      const c5 = d3.rgb(colorScaleLinear(valueMinMax[1]));
      c1.opacity = 0.5;
      c2.opacity = 0.5;
      c3.opacity = 0.5;
      c4.opacity = 0.5;
      c5.opacity = 0.5;

      if ($currentSensor.match(/num/)) {
        let min = Math.log(Math.max(0.14, valueMinMax[0])) / Math.log(10);
        let max = Math.log(valueMinMax[1]) / Math.log(10);
        let arr = logspace(min, max, 7);
        const colorScaleLog = d3
          .scaleSequentialLog(d3.interpolateYlOrRd)
          .domain([Math.max(0.14, valueMinMax[0]), valueMinMax[1]]);

        let tempStops = [[0, DIRECTION_THEME.countMin]];
        for (let i = 0; i < arr.length; i++) {
          tempStops.push([arr[i], colorScaleLog(arr[i])]);
        }
        stops = tempStops;
        stopsMega = [
          [0, DIRECTION_THEME.countMin],
          [valueMinMax[0], c1.toString()],
          [firstHalfCenter, c2.toString()],
          [center, c3.toString()],
          [secondHalfCenter, c4.toString()],
          [valueMinMax[1], c5.toString()],
        ];

        const minRadius = ENCODING_BUBBLE_THEME.minRadius[$currentLevel],
          maxRadius = ENCODING_BUBBLE_THEME.maxRadius[$currentLevel];

        currentRadiusScale = logScale()
          .domain(colorScaleLog.domain())
          .range([minRadius, maxRadius])
          .base(ENCODING_BUBBLE_THEME.base);
        radiusScale.set(currentRadiusScale);
      } else if ($currentSensor.match(/prop/)) {
        stops = [
          [0, DIRECTION_THEME.countMin],
          [valueMinMax[0], colorScaleLinear(valueMinMax[0])],
          [firstHalfCenter, colorScaleLinear(firstHalfCenter)],
          [center, colorScaleLinear(center)],
          [secondHalfCenter, colorScaleLinear(secondHalfCenter)],
          [valueMinMax[1], colorScaleLinear(valueMinMax[1])],
        ];
        stopsMega = [
          [0, DIRECTION_THEME.countMin],
          [valueMinMax[0], c1.toString()],
          [firstHalfCenter, c2.toString()],
          [center, c3.toString()],
          [secondHalfCenter, c4.toString()],
          [valueMinMax[1], c5.toString()],
        ];
      } else {
        stops = [
          [valueMinMax[0], colorScaleLinear(valueMinMax[0])],
          [firstHalfCenter, colorScaleLinear(firstHalfCenter)],
          [center, colorScaleLinear(center)],
          [secondHalfCenter, colorScaleLinear(secondHalfCenter)],
          [valueMinMax[1], colorScaleLinear(valueMinMax[1])],
        ];
        stopsMega = [
          [valueMinMax[0], c1.toString()],
          [firstHalfCenter, c2.toString()],
          [center, c3.toString()],
          [secondHalfCenter, c4.toString()],
          [valueMinMax[1], c5.toString()],
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
      map.getSource(center($currentLevel)).setData(centerDat);
      drawMega ? map.getSource('mega-county').setData(megaDat) : '';
    }

    if ($encoding == 'color') {
      // hide all bubble layers
      Object.keys($levels).forEach((name) => {
        map.setLayoutProperty(center(name), 'visibility', 'none');
        map.setLayoutProperty(centerHighlight(name), 'visibility', 'none');
      });

      Object.keys($levels).forEach((name) => {
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
    } else if ($encoding == 'bubble') {
      // hide all color layers except for the one for the current level (for tooltip)
      Object.keys($levels).forEach((name) => map.getLayer(name) && map.setLayoutProperty(name, 'visibility', 'none'));
      if (map.getLayer($currentLevel)) {
        map.setPaintProperty($currentLevel, 'fill-color', MAP_THEME.countyFill);

        map.setLayoutProperty($currentLevel, 'visibility', 'visible');
      }

      // hide all bubble layer except for the one for the current level
      Object.keys($levels).forEach((name) => {
        map.setLayoutProperty(center(name), 'visibility', 'none');
        map.setLayoutProperty(centerHighlight(name), 'visibility', 'none');
      });
      if (map.getLayer(center($currentLevel))) {
        const flatten = (arr) => arr.reduce((acc, val) => acc.concat(val), []);

        // color scale (color + stroke color)

        let flatStops = flatten(stops);
        flatStops.shift(); // remove the first element which has a value of 0 since the "step" expression of mapbox does not require it.

        flatStops[0] = 'transparent';
        let colorExpression = ['step', ['get', 'value']].concat(flatStops);

        map.setPaintProperty(center($currentLevel), 'circle-stroke-color', colorExpression);
        map.setPaintProperty(centerHighlight($currentLevel), 'circle-stroke-color', colorExpression);

        map.setPaintProperty(center($currentLevel), 'circle-color', colorExpression);
        map.setPaintProperty(centerHighlight($currentLevel), 'circle-color', colorExpression);

        // radius scale
        const [a, b, base] = currentRadiusScale.coef();
        const baseLog = Math.log10(base);

        let radiusExpression = ['+', ['*', a, ['/', ['log10', ['get', 'value']], baseLog]], b];

        map.setPaintProperty(center($currentLevel), 'circle-radius', radiusExpression);
        map.setPaintProperty(centerHighlight($currentLevel), 'circle-radius', radiusExpression);

        map.setLayoutProperty(center($currentLevel), 'visibility', 'visible');
        map.setLayoutProperty(centerHighlight($currentLevel), 'visibility', 'visible');
      }

      map.setLayoutProperty('mega-county', 'visibility', 'none');
    }

    const viableFeatures = dat.features.filter((f) => f.properties[$signalType] !== -100);

    // set a random focus on start up
    if (chosenRandom === false && $mounted) {
      if (viableFeatures.length > 0) {
        const found = viableFeatures.filter(
          (f) =>
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
            map.setFeatureState({ source: center($currentLevel), id: clickedId }, { select: true });
          }
          chosenRandom = true;
        } else {
          const index = Math.floor(Math.random() * (viableFeatures.length - 1));
          const randomFeature = viableFeatures[index];
          currentRegionName.set(randomFeature.properties.NAME);
          currentRegion.set(randomFeature.properties.id);

          clickedId = randomFeature.id;
          map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: true });
          map.setFeatureState({ source: center($currentLevel), id: clickedId }, { select: true });
          chosenRandom = true;
        }
      }
    }

    if ($currentRegion) {
      const megaFound = megaDat.features.filter((f) => f.properties.STATE + '000' === $currentRegion + '');
      const found = viableFeatures.filter((f) => f.properties.id === $currentRegion);
      if (megaFound.length > 0) {
        megaClickedId = parseInt(megaFound[0].properties.STATE);
        currentRegionName.set(megaFound[0].properties.NAME);
        map.setFeatureState({ source: 'mega-county', id: megaClickedId }, { select: true });
      }
      if (found.length > 0) {
        clickedId = found[0].id;
        currentRegionName.set(found[0].properties.NAME);
        map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: true });
        map.setFeatureState({ source: center($currentLevel), id: clickedId }, { select: true });
      }
    }
  }

  function get_label_specifics(name, state, level) {
    let text = '';
    if ($currentLevel === 'county' && level !== 'mega-county' && !special_counties.includes(name)) {
      text += ' County';
    }
    if (level === 'county') {
      text += ', ' + dict[state];
    }
    return text;
  }

  function label_states() {
    if (map !== undefined) {
      if ($currentLevel == 'state') {
        map.setLayoutProperty('state-names', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('state-names', 'visibility', 'none');
      }
    }
  }

  function initializeMap() {
    stateBounds = computeBounds($geojsons.get('state'));
    zoneBounds = computeBounds($geojsons.get('zone'));

    map = new mapboxgl.Map({
      attributionControl: false,
      container,
      style: './maps/mapbox_albers_usa_style.json',
      bounds: showCurrentZone ? zoneBounds : stateBounds,
      fitBounds: showCurrentZone ? zoneBoundsOptions : stateBoundsOptions,
    }).addControl(new mapboxgl.AttributionControl({ compact: true }));
    // .addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    //Disable touch zoom, it makes gesture scrolling difficult
    map.scrollZoom.disable();

    popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'map-popup',
    });
    map.on('mousemove', 'state-outline', onMouseMove('state-outline'));
    map.on('mouseleave', 'state-outline', onMouseLeave('state-outline'));

    [...Object.keys($levels), 'mega-county'].forEach((level) => {
      map.on('mouseenter', level, onMouseEnter(level));
      map.on('mousemove', level, onMouseMove(level));
      map.on('mouseleave', level, onMouseLeave(level));
      map.on('click', level, onClick(level));
    });

    map.on('idle', () => {
      currentDataReadyOnMap.set(true);
      mapFirstLoaded.set(true);
    });

    map.on('error', () => {
      mapFirstLoaded.set(true);
    });

    map.on('load', function () {
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
      map.addSource('zone-outline', {
        type: 'geojson',
        data: $geojsons.get('zone'),
      });

      Object.keys($levels).forEach((level) => {
        map.addSource(center(level), {
          type: 'geojson',
          data: $geojsons.get(center(level)),
        });
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

      Object.keys($levels).forEach((name) => {
        map.addSource(name, {
          type: 'geojson',
          data: $geojsons.get(name),
        });
      });

      ['mega-county', ...Object.keys($levels)].forEach((name) => {
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
        id: 'state-names',
        source: center('state'),
        type: 'symbol',
        maxzoom: 8,
        layout: {
          'text-field': ['upcase', ['get', 'NAME']],
          'text-font': ['Open Sans Bold'],
          'text-size': 11,
        },
        paint: {
          'text-opacity': 0.5,
          'text-halo-color': '#fff',
          'text-halo-width': 1,
        },
      });

      map.addLayer(
        {
          id: 'city-point-unclustered-pit',
          source: 'city-point',
          type: 'symbol',
          filter: ['==', 'city', 'Pittsburgh'],
          maxzoom: 8,
          layout: {
            'text-field': ['get', 'city'],
            'text-font': ['Open Sans Regular'],
            'text-size': 12,
          },
          paint: {
            'text-halo-color': '#fff',
            'text-halo-width': 1.5,
          },
        },
        'state-names',
      );
      map.addLayer(
        {
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
            'text-halo-width': 1.5,
          },
        },
        'state-names',
      );
      map.addLayer(
        {
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
            'text-halo-width': 1.5,
          },
        },
        'state-names',
      );
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
          'text-halo-width': 1.5,
        },
      });
      map.addLayer(
        {
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
            'text-halo-width': 1.5,
          },
        },
        'state-names',
      );

      label_states();

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

      Object.keys($levels).forEach((level) => {
        map.addLayer(
          {
            id: level,
            source: level,
            type: 'fill',
            visibility: 'none',
            filter: ['!=', $signalType, -100],
            paint: {
              'fill-outline-color': MAP_THEME.countyOutlineWhenFilled,
              'fill-color': MAP_THEME.countyFill,
            },
          },
          `${level}-hover`,
        );
      });

      Object.keys($levels).forEach((level) => {
        map.addLayer(
          {
            id: center(level),
            source: center(level),
            type: 'circle',
            visibility: 'none',
            filter: ['>', ['get', 'value'], 0],
            paint: {
              'circle-radius': 0,
              'circle-color': ENCODING_BUBBLE_THEME.color,
              'circle-stroke-color': ENCODING_BUBBLE_THEME.strokeColor,
              'circle-stroke-width': ENCODING_BUBBLE_THEME.strokeWidth,
              'circle-opacity': [
                'case',
                [
                  'any',
                  ['boolean', ['feature-state', 'hover'], false],
                  ['boolean', ['feature-state', 'select'], false],
                ],
                0,
                ENCODING_BUBBLE_THEME.opacity,
              ],
              'circle-stroke-opacity': [
                'case',
                [
                  'any',
                  ['boolean', ['feature-state', 'hover'], false],
                  ['boolean', ['feature-state', 'select'], false],
                ],
                0,
                ENCODING_BUBBLE_THEME.strokeOpacity,
              ],
            },
          },
          `${level}-hover`,
        );

        map.addLayer(
          {
            id: centerHighlight(level),
            source: center(level),
            type: 'circle',
            visibility: 'none',
            filter: ['>', ['get', 'value'], 0],
            paint: {
              'circle-radius': 0,
              'circle-color': ENCODING_BUBBLE_THEME.color,
              'circle-stroke-color': ENCODING_BUBBLE_THEME.strokeColor,
              'circle-stroke-width': ENCODING_BUBBLE_THEME.strokeWidthHovered,
              'circle-opacity': [
                'case',
                [
                  'any',
                  ['boolean', ['feature-state', 'hover'], false],
                  ['boolean', ['feature-state', 'select'], false],
                ],
                ENCODING_BUBBLE_THEME.opacity,
                0,
              ],
              'circle-stroke-opacity': [
                'case',
                [
                  'any',
                  ['boolean', ['feature-state', 'hover'], false],
                  ['boolean', ['feature-state', 'select'], false],
                ],
                ENCODING_BUBBLE_THEME.strokeOpacity,
                0,
              ],
            },
          },
          'city-point-unclustered-pit',
        );
      });

      if ($currentZone === 'swpa') {
        showZoneBoundary('swpa');
      }

      mapMounted = true;
      updateMap('init');
    });
  }

  function showZoneBoundary(zoneName) {
    if (zoneName === 'swpa') {
      map.addLayer({
        id: 'zone-outline',
        source: 'zone-outline',
        type: 'line',
        paint: {
          'line-color': MAP_THEME.zoneOutline,
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });
    }
  }

  function resetHighlightedFeature() {
    if (clickedId) {
      map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: false });
    }
    clickedId = null;
    if (megaClickedId) {
      map.setFeatureState({ source: 'mega-county', id: megaClickedId }, { select: false });
    }
    megaClickedId = null;
  }

  function highlightFeature(selectedRegion) {
    clickedId = Number.parseInt(selectedRegion['id']);

    map.setFeatureState({ source: $currentLevel, id: clickedId }, { select: true });
    map.setFeatureState({ source: center($currentLevel), id: clickedId }, { select: true });
  }

  function resetSearch() {
    if (!selectedRegion) {
      // not set before
      return;
    }
    selectedRegion = null;
    // reset and fly out
    currentRegionName.set('');
    currentRegion.set('');
    resetHighlightedFeature();
    // fly out
    map.fitBounds(stateBounds, stateBoundsOptions);
  }

  function searchElement(selection) {
    if (selectedRegion === selection) {
      return;
    }
    if (!selection) {
      return resetSearch();
    }

    selectedRegion = selection;

    let hasValueFlag = false;
    const availLevels = $sensorMap.get($currentSensor).levels;
    for (let i = 0; i < availLevels.length; i++) {
      if (selectedRegion['level'] === availLevels[i]) {
        hasValueFlag = true;
        break;
      }
    }
    if (!hasValueFlag) {
      invalidSearch = true;
      searchErrorComponent.count();
      return;
    }
    if (selectedRegion['level'] !== $currentLevel) {
      currentDataReadyOnMap.set(false);
      currentLevel.set(selectedRegion['level']);
    }
    resetHighlightedFeature();

    currentRegionName.set(selectedRegion['name']);
    currentRegion.set(selectedRegion['property_id']);

    highlightFeature(selectedRegion);

    // Get zoom and center of selected location
    let centersData = $geojsons.get(center($currentLevel))['features'];
    let center_location;
    for (let i = 0; i < centersData.length; i++) {
      let info = centersData[i];
      if (info['properties']['id'] == selectedRegion['property_id']) {
        center_location = info['geometry']['coordinates'];
        break;
      }
    }

    // TODO better zoom
    let zoomLevel;
    if (selectedRegion['level'] === 'county') {
      zoomLevel = 6.5;
    } else if (selectedRegion['level'] === 'msa') {
      zoomLevel = 6;
    } else {
      zoomLevel = 5;
    }

    map.flyTo({ center: center_location, zoom: zoomLevel, essential: true });
  }
</script>

<style>
  .top-container {
    position: absolute;
    top: 10px;
    right: 12px;
    left: 12px;

    display: grid;
    grid-gap: 0.1em;
    grid-template-columns: auto 2fr 1fr auto;
    grid-template-rows: auto auto;
    grid-template-areas:
      'options options search controls'
      'toggle title title controls';
  }

  :global(.map-container) {
    position: relative;
    flex: 1 1 80vh;
    min-height: 550px;
  }

  .map-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  :global(.container-bg) {
    /* rounded design refresh */
    border-radius: 7px;
    background-color: #ffffff;
    box-shadow: 0px 4px 10px rgba(151, 151, 151, 0.25);
  }

  :global(.container-style) {
    padding: 8px 8px;
    box-sizing: border-box;
    transition: all 0.1s ease-in;
    font-family: 'Open Sans', Helvetica, sans-serif !important;
  }

  .options-container {
    z-index: 1003;
    max-width: 50em;
    grid-area: options;
  }

  .toggle-container {
    z-index: 1001;
    grid-area: toggle;
  }

  .title-container {
    z-index: 1001;
    grid-area: title;
    align-self: flex-start;
    justify-self: center;
    padding: 0 1em;
  }

  .search-container-wrapper {
    grid-area: search;
    position: relative;
    min-width: 2.8em;
  }

  .search-container-wrapper > :global(*) {
    z-index: 1002;
  }

  /** mobile **/
  @media only screen and (max-width: 767px) {
    .top-container {
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto auto auto;
      grid-template-areas:
        'options options options'
        'search title controls'
        'toggle title controls';
    }
  }

  /** desktop **/
  @media only screen and (min-width: 767px) {
    .title-container {
      background-color: unset;
      box-shadow: none;
    }
  }

  .map-controls-container {
    margin-left: 1em;
    z-index: 1001;
    grid-area: controls;
    display: flex;
    align-items: flex-start;
  }

  .legend-container {
    position: absolute;
    bottom: 12px;
    left: 10px;
    z-index: 1000;
    /*height: 105px;*/
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    transition: all 0.1s ease-in;
  }

  .invalid_search-container {
    position: absolute;
    transition: opacity 0.3s ease-in-out;
    z-index: 1003;
    top: 12px;
    width: 250px;
    background-color: rgba(255, 255, 255, 0.9);
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
  }

  .time-container {
    position: absolute;
    bottom: 12px;
    right: 10px;
    z-index: 1002;
    padding: 30px 10px;
    box-sizing: border-box;
    transition: all 0.1s ease-in;
  }

  .hidden {
    display: none;
  }
</style>

<main class="map-container">
  <div class="top-container">
    <div class="options-container container-bg base-font-size container-style">
      <Options />
    </div>
    <div class="search-container-wrapper base-font-size">
      {#if loaded && regionList.length != 0}
        <Search
          className="search-container container-bg container-style"
          placeholder="Search for a location..."
          items={regionList}
          selectedItem={selectedRegion}
          labelFieldName="display_name"
          maxItemsToShowInList="5"
          onChange={searchElement} />
      {/if}
    </div>
    <div
      class="toggle-container container-bg base-font-size container-style"
      class:hidden={$signalType === 'direction' || !$currentSensor.match(/num/)}>
      <Toggle />
    </div>
    <div class="title-container container-bg">
      <Title />
    </div>
    <div class="map-controls-container">
      <MapControls
        zoom={map ? map.getZoom() : 0}
        maxZoom={map ? map.getMaxZoom() : 100}
        minZoom={map ? map.getMinZoom() : -100}
        on:zoomIn={() => {
          map.zoomIn();
        }}
        on:zoomOut={() => {
          map.zoomOut();
        }}
        on:reset={() => {
          map.fitBounds(stateBounds, stateBoundsOptions);
        }}
        on:swpa={() => {
          map.fitBounds(zoneBounds, zoneBoundsOptions);
          showZoneBoundary('swpa');
        }} />
    </div>
  </div>

  <div class="legend-container container-bg">
    <Legend />
  </div>

  <div class="invalid_search-container">
    <Banner bind:this={searchErrorComponent} />
  </div>

  <div class="time-container container-bg">
    <Time />
  </div>

  <GraphContainer {isIE} {graphShowStatus} {toggleGraphShowStatus} />

  <div class="map-wrapper" bind:this={container} />
</main>
