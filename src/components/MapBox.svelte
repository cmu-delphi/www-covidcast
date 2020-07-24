<script>
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import { getTextColorBasedOnBackground, LogScale, zip, transparent } from '../util.js';
  import { DIRECTION_THEME, MAP_THEME, ENCODING_BUBBLE_THEME, ENCODING_SPIKE_THEME } from '../theme.js';
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
    colorScale,
    colorStops,
    bubbleRadiusScale,
    spikeHeightScale,
    dict,
    specialCounties,
    defaultRegionOnStartup,
  } from '../stores';
  import * as d3 from 'd3';
  import logspace from 'compute-logspace';
  import { isCountSignal, isPropSignal } from '../data/signals';

  export let graphShowStatus, toggleGraphShowStatus;

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
  let popup, topPopup;
  let megaHoveredId;
  let clickedId;
  let megaClickedId;
  let selectedRegion;

  $: regionList = [];
  $: loaded = false;
  $: invalidSearch = false;

  const BUBBLE_LAYER = 'bubble',
    SPIKE_LAYER = 'spike';

  // given the level (state/msa/county), returns the name of its "centered" source/layer
  function center(name) {
    return `${name}-centers`;
  }

  function highlight(name) {
    return `${name}-highlight`;
  }

  function outline(name) {
    return `${name}-outline`;
  }

  // helper function for multiple calls of map.setFeatureState
  function setFeatureStateMultiple(sources, id, state) {
    sources.forEach((s) => {
      map.setFeatureState({ source: s, id: id }, state);
    });
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
    ($encoding === 'spike' ? topPopup : popup).setLngLat(e.lngLat).addTo(map);
    setFeatureStateMultiple([level, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], hoveredId, { hover: false });
    map.setFeatureState({ source: 'mega-county', id: megaHoveredId }, { hover: false });
  };

  const onMouseMove = (level) => (e) => {
    if (level === 'state-outline') {
      map.getCanvas().style.cursor = 'pointer';
      ($encoding === 'spike' ? topPopup : popup)
        .setLngLat(e.lngLat)
        .setHTML('Estimate unavailable for rest of ' + e.features[0].properties.NAME)
        .addTo(map);
      return;
    }

    setFeatureStateMultiple([level, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], hoveredId, { hover: false });
    map.setFeatureState({ source: 'mega-county', id: megaHoveredId }, { hover: false });

    let fillColor;
    if (level === 'mega-county') {
      if (hoveredId === null) {
        megaHoveredId = e.features[0].id;
        map.setFeatureState({ source: level, id: megaHoveredId }, { hover: true });

        const value = e.features[0].properties.value;
        fillColor = $colorScale(value);
      } else {
        megaHoveredId = null;
      }
    } else {
      // The hovered element is not a mega county. It can be county, msa, state, bubble, or spike.

      hoveredId = e.features[0].id;
      setFeatureStateMultiple([level, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], hoveredId, { hover: true });

      const value = e.features[0].properties.value;
      fillColor = $colorScale(value);
    }

    if (hoveredId !== null && level === 'mega-county') return;
    // popup
    const { value, direction, NAME, STATE, Population } = e.features[0].properties;

    const date = formatTimeWithoutYear(parseTime($currentDate));
    const sens = $sensorMap.get($currentSensor);
    const popCommas = parseInt(Population).toLocaleString();
    let title = (level === 'mega-county' ? 'Rest of ' : '') + NAME + getLabelSpecifics(NAME, STATE, level);
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

    ($encoding === 'spike' ? topPopup : popup).setLngLat(e.lngLat).setHTML(body).addTo(map);
  };

  const onMouseLeave = (level) => () => {
    if (level === 'state-outline') {
      popup.remove();
      topPopup.remove();
      return;
    }
    map.setFeatureState({ source: 'mega-county', id: megaHoveredId }, { hover: false });
    if (level === 'mega-county' && hoveredId !== null) megaHoveredId = null;

    setFeatureStateMultiple([level, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], hoveredId, { hover: false });

    if (level !== 'mega-county') hoveredId = null;

    map.getCanvas().style.cursor = '';
    popup.remove();
    topPopup.remove();
  };

  const onClick = (level) => (e) => {
    if (clickedId) {
      setFeatureStateMultiple([level, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], clickedId, { select: false });
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
      setFeatureStateMultiple([level, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], megaClickedId, {
        select: true,
      });

      currentRegionName.set(e.features[0].properties.NAME);
      currentRegion.set(e.features[0].properties.STATE + '000');
    } else {
      megaClickedId = null;
      if (clickedId !== e.features[0].id) {
        clickedId = e.features[0].id;
        setFeatureStateMultiple([level, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], clickedId, { select: true });
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
    labelStates();
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
    // centerDat: data for bubbles and spikes
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

    if (['data', 'init'].includes(type)) {
      map.getSource($currentLevel).setData(dat);
      map.getSource(center($currentLevel)).setData(centerDat);
      drawMega ? map.getSource('mega-county').setData(megaDat) : '';
    }

    let stops, stopsMega, currentRadiusScale;

    if ($signalType === 'value') {
      valueMinMax[0] = Math.max(0, valueMinMax[0]);
      const center = valueMinMax[0] + (valueMinMax[1] - valueMinMax[0]) / 2,
        firstHalfCenter = valueMinMax[0] + (center - valueMinMax[0]) / 2,
        secondHalfCenter = center + (valueMinMax[1] - center) / 2;

      const colorScaleLinear = d3.scaleSequential(d3.interpolateYlOrRd).domain([valueMinMax[0], valueMinMax[1]]);
      const colorScaleLog = d3
        .scaleSequentialLog(d3.interpolateYlOrRd)
        .domain([Math.max(0.14, valueMinMax[0]), valueMinMax[1]]);

      // domainStops7 is used to determine the colors of regions for count signals.
      const domainStops7 = logspace(
        Math.log(Math.max(0.14, valueMinMax[0])) / Math.log(10),
        Math.log(valueMinMax[1]) / Math.log(10),
        7,
      );
      // domainStops5 is used for other cases (prop signals)
      const domainStops5 = [valueMinMax[0], firstHalfCenter, center, secondHalfCenter, valueMinMax[1]];

      const logColors7 = domainStops7.map((c) => colorScaleLog(c).toString());
      const linearColors5 = domainStops5.map((c) => colorScaleLinear(c).toString());

      if (isCountSignal($currentSensor)) {
        // use log scale
        stops = [[0, DIRECTION_THEME.countMin]].concat(zip(domainStops7, logColors7));
        stopsMega = [[0, DIRECTION_THEME.countMin]].concat(zip(domainStops7, logColors7));

        // store the color scale (used for tooltips and legend)
        colorScale.set(colorScaleLog);
        colorStops.set(stops);
      } else if (isPropSignal($currentSensor)) {
        stops = [[0, DIRECTION_THEME.countMin]].concat(zip(domainStops5, linearColors5));
        stopsMega = [[0, DIRECTION_THEME.countMin]].concat(zip(domainStops5, transparent(linearColors5, 0.5)));

        // store the color scale (used for tooltips and legend)
        colorScale.set(colorScaleLinear);
        colorStops.set(stops);
      } else {
        stops = zip(domainStops5, linearColors5);
        stopsMega = zip(domainStops5, transparent(linearColors5, 0.5));

        // store the color scale (used for tooltips and legend)
        colorScale.set(colorScaleLinear);
        colorStops.set(stops);
      }
    } else {
      // signalType is 'direction'
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

      colorStops.set(stops);
    }

    const show = (name) => map.setLayoutProperty(name, 'visibility', 'visible'),
      hide = (name) => map.setLayoutProperty(name, 'visibility', 'none'),
      showAll = (names) => names.forEach(show),
      hideAll = (names) => names.forEach(hide),
      otherLevels = Object.keys($levels).filter((name) => name !== $currentLevel);

    if ($encoding === 'color') {
      // hide all other layers
      hideAll([BUBBLE_LAYER, highlight(BUBBLE_LAYER)]);
      hideAll([SPIKE_LAYER, outline(SPIKE_LAYER), highlight(SPIKE_LAYER), highlight(outline(SPIKE_LAYER))]);
      hideAll(otherLevels);

      show($currentLevel);

      map.setPaintProperty($currentLevel, 'fill-color', {
        property: $signalType,
        stops: stops,
      });

      if (drawMega) {
        map.setPaintProperty('mega-county', 'fill-color', {
          property: $signalType,
          stops: stopsMega,
        });
        show('mega-county');
      } else {
        hide('mega-county');
      }
    } else if ($encoding === 'bubble') {
      // hide all color layers except for one for the current level (for tooltip)
      hideAll(otherLevels);
      show($currentLevel);
      map.setPaintProperty($currentLevel, 'fill-color', MAP_THEME.countyFill);
      hideAll([SPIKE_LAYER, outline(SPIKE_LAYER), highlight(SPIKE_LAYER), highlight(outline(SPIKE_LAYER))]);

      // show bubble layers
      showAll([BUBBLE_LAYER, highlight(BUBBLE_LAYER)]);

      // color scale (color + stroke color)
      let flatStops = stops.flat();
      flatStops.shift(); // remove the first element which has a value of 0 since the "step" expression of MapBox can omit the first range.

      flatStops[0] = 'transparent';
      let colorExpression = ['step', ['get', 'value']].concat(flatStops);

      map.getSource(BUBBLE_LAYER).setData(map.getSource(center($currentLevel))._data);

      map.setPaintProperty(BUBBLE_LAYER, 'circle-stroke-color', colorExpression);
      map.setPaintProperty(highlight(BUBBLE_LAYER), 'circle-stroke-color', colorExpression);

      map.setPaintProperty(BUBBLE_LAYER, 'circle-color', colorExpression);
      map.setPaintProperty(highlight(BUBBLE_LAYER), 'circle-color', colorExpression);

      const minRadius = ENCODING_BUBBLE_THEME.minRadius[$currentLevel],
        maxRadius = ENCODING_BUBBLE_THEME.maxRadius[$currentLevel];

      currentRadiusScale = LogScale()
        .domain([Math.max(0.14, valueMinMax[0]), valueMinMax[1]])
        .range([minRadius, maxRadius])
        .base(ENCODING_BUBBLE_THEME.base);

      bubbleRadiusScale.set(currentRadiusScale);

      // radius scale
      const [a, b, base] = currentRadiusScale.coef();
      const baseLog = Math.log10(base);

      let radiusExpression = ['+', ['*', a, ['/', ['log10', ['get', 'value']], baseLog]], b];

      map.setPaintProperty(BUBBLE_LAYER, 'circle-radius', radiusExpression);
      map.setPaintProperty(highlight(BUBBLE_LAYER), 'circle-radius', radiusExpression);

      hide('mega-county');
    } else if ($encoding === 'spike') {
      // hide all color layers except one for the current level

      hideAll(otherLevels);
      show($currentLevel);
      map.setPaintProperty($currentLevel, 'fill-color', MAP_THEME.countyFill);
      hideAll([BUBBLE_LAYER, highlight(BUBBLE_LAYER)]);

      showAll([SPIKE_LAYER, outline(SPIKE_LAYER), highlight(SPIKE_LAYER), highlight(outline(SPIKE_LAYER))]);

      const valueMax = valueMinMax[1],
        maxHeight = ENCODING_SPIKE_THEME.maxHeight[$currentLevel],
        size = ENCODING_SPIKE_THEME.size[$currentLevel];

      const scale = d3.scaleSqrt().range([0, maxHeight]).domain([0, valueMax]);

      spikeHeightScale.set(scale);
      const centers = $geojsons.get(center($currentLevel));
      const features = centers.features.filter((feature) => feature.properties.value > 0);

      const spikes = {
        type: 'FeatureCollection',
        features: features.map((feature) => {
          const center = feature.geometry.coordinates,
            value = feature.properties.value;
          return {
            geometry: {
              coordinates: [
                [
                  [center[0] - size, center[1]],
                  [center[0], center[1] + scale(value)],
                  [center[0] + size, center[1]],
                ],
              ],
              type: 'Polygon',
            },
            properties: { value: value },
            type: 'Feature',
            id: feature.id,
          };
        }),
      };

      const spikeOutlines = {
        type: 'FeatureCollection',
        features: features.map((feature) => {
          const center = feature.geometry.coordinates,
            value = feature.properties.value;

          return {
            geometry: {
              coordinates: [
                [center[0] - size, center[1]],
                [center[0], center[1] + scale(value)],
                [center[0] + size, center[1]],
              ],
              type: 'LineString',
            },
            properties: { value: value },
            type: 'Feature',
            id: feature.id,
          };
        }),
      };

      let flatStops = stops.flat();
      flatStops.shift(); // remove the first element which has a value of 0 since the "step" expression of mapbox does not require it.

      flatStops[0] = 'transparent';
      let colorExpression = ['step', ['get', 'value']].concat(flatStops);
      map.setPaintProperty(SPIKE_LAYER, 'fill-color', colorExpression);
      map.setPaintProperty(outline(SPIKE_LAYER), 'line-color', colorExpression);
      map.setPaintProperty(highlight(SPIKE_LAYER), 'fill-color', colorExpression);
      map.setPaintProperty(highlight(outline(SPIKE_LAYER)), 'line-color', colorExpression);
      map.setPaintProperty(outline(SPIKE_LAYER), 'line-width', ENCODING_SPIKE_THEME.strokeWidth[$currentLevel]);

      map.getSource(SPIKE_LAYER).setData(spikes);
      map.getSource(outline(SPIKE_LAYER)).setData(spikeOutlines);

      hide('mega-county');
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
            setFeatureStateMultiple([$currentLevel, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], clickedId, {
              select: true,
            });
          }
          chosenRandom = true;
        } else {
          const index = Math.floor(Math.random() * (viableFeatures.length - 1));
          const randomFeature = viableFeatures[index];
          currentRegionName.set(randomFeature.properties.NAME);
          currentRegion.set(randomFeature.properties.id);

          clickedId = randomFeature.id;
          setFeatureStateMultiple([$currentLevel, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], clickedId, {
            select: true,
          });
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
        setFeatureStateMultiple([$currentLevel, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], clickedId, {
          select: true,
        });
      }
    }
  }

  function getLabelSpecifics(name, state, level) {
    let text = '';
    if ($currentLevel === 'county' && level !== 'mega-county' && !specialCounties.includes(name)) {
      text += ' County';
    }
    if (level === 'county') {
      text += ', ' + dict[state];
    }
    return text;
  }

  function labelStates() {
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

    topPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'map-popup',
      anchor: 'top',
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
      map.addSource(outline('county'), {
        type: 'geojson',
        data: $geojsons.get('county'),
      });
      map.addSource(outline('state'), {
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

      map.addSource(BUBBLE_LAYER, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addSource(SPIKE_LAYER, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addSource(outline(SPIKE_LAYER), {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: outline('county'),
        source: outline('county'),
        type: 'fill',
        paint: {
          'fill-color': MAP_THEME.countyFill,
          'fill-outline-color': MAP_THEME.countyOutline,
          'fill-opacity': 0.4,
        },
      });

      map.addLayer({
        id: outline('state'),
        source: outline('state'),
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

      labelStates();

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

      // 2 layers for bubbles

      map.addLayer(
        {
          id: BUBBLE_LAYER,
          source: BUBBLE_LAYER,
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
              ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
              0,
              ENCODING_BUBBLE_THEME.opacity,
            ],
            'circle-stroke-opacity': [
              'case',
              ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
              0,
              ENCODING_BUBBLE_THEME.strokeOpacity,
            ],
          },
        },
        'county-hover',
      );

      map.addLayer(
        {
          id: highlight(BUBBLE_LAYER),
          source: BUBBLE_LAYER,
          type: 'circle',
          visibility: 'none',
          filter: ['>', ['get', 'value'], 0],
          paint: {
            'circle-radius': 0,
            'circle-color': ENCODING_BUBBLE_THEME.color,
            'circle-stroke-color': ENCODING_BUBBLE_THEME.strokeColor,
            'circle-stroke-width': ENCODING_BUBBLE_THEME.strokeWidthHighlighted,
            'circle-opacity': [
              'case',
              ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
              ENCODING_BUBBLE_THEME.opacity,
              0,
            ],
            'circle-stroke-opacity': [
              'case',
              ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
              ENCODING_BUBBLE_THEME.strokeOpacity,
              0,
            ],
          },
        },
        'city-point-unclustered-pit',
      );

      // 4 layers for spikes

      map.addLayer(
        {
          id: SPIKE_LAYER,
          type: 'fill',
          source: SPIKE_LAYER,
          filter: ['>', ['get', 'value'], 0],
          paint: {
            'fill-color': 'transparent',
            'fill-opacity': [
              'case',
              ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
              0,
              ENCODING_SPIKE_THEME.fillOpacity,
            ],
            'fill-outline-color': 'transparent',
          },
        },
        'county-hover',
      );

      map.addLayer(
        {
          id: outline(SPIKE_LAYER),
          type: 'line',
          source: outline(SPIKE_LAYER),
          filter: ['>', ['get', 'value'], 0],
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': 'transparent',
            'line-opacity': [
              'case',
              ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
              0,
              ENCODING_SPIKE_THEME.strokeOpacity,
            ],
          },
        },
        'county-hover',
      );

      map.addLayer(
        {
          id: highlight(SPIKE_LAYER),
          type: 'fill',
          source: SPIKE_LAYER,
          filter: ['>', ['get', 'value'], 0],
          paint: {
            'fill-color': 'transparent',
            'fill-opacity': [
              'case',
              ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
              ENCODING_SPIKE_THEME.fillOpacity,
              0,
            ],
            'fill-outline-color': 'transparent',
          },
        },
        'city-point-unclustered-pit',
      );

      map.addLayer(
        {
          id: highlight(outline(SPIKE_LAYER)),
          type: 'line',
          source: outline(SPIKE_LAYER),
          filter: ['>', ['get', 'value'], 0],
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': 'transparent',
            'line-width': ENCODING_SPIKE_THEME.strokeWidthHighlighted,
            'line-opacity': [
              'case',
              ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
              ENCODING_SPIKE_THEME.strokeOpacity,
              0,
            ],
          },
        },
        'city-point-unclustered-pit',
      );

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

    megaClickedId = null;
    currentRegionName.set(selectedRegion['name']);
    currentRegion.set(selectedRegion['property_id']);
    clickedId = parseInt(selectedRegion['id']);
    setFeatureStateMultiple([$currentLevel, BUBBLE_LAYER, SPIKE_LAYER, outline(SPIKE_LAYER)], clickedId, {
      select: true,
    });

    // Get zoom and center of selected location
    let centersData = $geojsons.get(center($currentLevel))['features'];
    let centerLocation;
    for (let i = 0; i < centersData.length; i++) {
      let info = centersData[i];
      if (info['properties']['id'] == selectedRegion['property_id']) {
        centerLocation = info['geometry']['coordinates'];
        break;
      }
    }

    highlightFeature(selectedRegion);

    // TODO better zoom
    let zoomLevel;
    if (selectedRegion['level'] === 'county') {
      zoomLevel = 6.5;
    } else if (selectedRegion['level'] === 'msa') {
      zoomLevel = 6;
    } else {
      zoomLevel = 5;
    }

    map.flyTo({ center: centerLocation, zoom: zoomLevel, essential: true });
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

  <GraphContainer {graphShowStatus} {toggleGraphShowStatus} />

  <div class="map-wrapper" bind:this={container} />
</main>
