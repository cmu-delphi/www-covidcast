<script>
  import { onMount } from 'svelte';
  import Options from './Options.svelte';
  import Tabs from './Tabs.svelte';
  import Time from './Time.svelte';
  import Legend from './Legend.svelte';
  import MapBox from './MapBox.svelte';
  import Graph from './Graph.svelte';

  import {
    sensors,
    times,
    stats,
    signalType,
    currentRange,
    currentSensor,
    currentDate,
    currentLevel,
    currentRegion,
    currentRegionName,
    regionSliceCache,
    timeSliceCache,
    currentData,
    regionData,
    metaData,
    mounted,
    mapFirstLoaded,
    yesterday,
  } from './stores.js';

  import { calculateValFromRectified } from './util.js';
  import * as d3 from 'd3';

  const ENDPOINT = 'https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day';
  const ENDPOINT_META = 'https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast_meta&cached=true';

  let error = null;
  let changingSensor = false;
  let graphShowStatus = false;
  let levelChangedWhenSensorChanged = false;
  let dateChangedWhenSensorChanged = false;

  function toggleGraphShowStatus(event, to = null) {
    if (to !== null) {
      graphShowStatus = to;
    } else {
      graphShowStatus = !graphShowStatus;
    }
  }

  function updateRegionSliceCache(sensor, level, date, reason = 'unspecified') {
    if (!$mounted) return;
    if (!$sensors.find(d => d.id === sensor).levels.includes(level)) return;
    if (date > $times.get(sensor)[1] || reason === 'level change') return;

    let cacheEntry = $regionSliceCache.get(sensor + level + date);
    if (!cacheEntry) {
      let q =
        ENDPOINT +
        '&data_source=' +
        sensor +
        '&signal=' +
        $sensors.find(d => d.id === sensor).signal +
        '&geo_type=' +
        level +
        '&time_values=' +
        date +
        '&geo_value=*';
      fetch(q)
        .then(d => d.json())
        .then(d => {
          if (d.result < 0 || d.message.includes('no results')) {
            currentData.set([]);
            regionSliceCache.update(m => m.set(sensor + level + date, []));
          } else {
            let { epidata } = d;
            epidata = epidata.map(item => {
              return { ...item, sensor, level };
            });
            currentData.set(epidata);
            regionSliceCache.update(m => m.set(sensor + level + date, d.epidata));
          }
        });
    } else {
      currentData.set(cacheEntry);
    }
  }

  function updateTimeSliceCache(sensor, level, region) {
    if (!$mounted) return;
    if (!region) {
      regionData.set([]);
      return;
    }
    let cacheEntry = $timeSliceCache.get(sensor + level + region);

    // check if the currentRegion has data on the current date
    const checkIfCurrentRegionHasDataOnCurrentDate = (region_data = []) => {
      let flag = false;
      region_data.forEach(item => {
        if (item.time_value == $currentDate) {
          flag = true;
        }
      });
      return flag;
    };

    if (!cacheEntry) {
      let q =
        ENDPOINT +
        '&data_source=' +
        sensor +
        '&signal=' +
        $sensors.find(d => d.id === sensor).signal +
        '&geo_type=' +
        level +
        '&time_values=20100101-20300101' +
        '&geo_value=' +
        region;
      fetch(q)
        .then(d => d.json())
        .then(d => {
          // console.log(q, d);
          regionData.set(d.epidata);
          timeSliceCache.update(m => m.set(sensor + level + region, d.epidata));
          if (!checkIfCurrentRegionHasDataOnCurrentDate(d.epidata)) {
            currentRegion.set('');
            currentRegionName.set('');
          }
        });
    } else {
      regionData.set(cacheEntry);
      if (!checkIfCurrentRegionHasDataOnCurrentDate(cacheEntry)) {
        currentRegion.set('');
        currentRegionName.set('');
      }
    }
  }

  currentSensor.subscribe(s => {
    if (!$mounted) return;

    let l = $currentLevel;
    let minDate = $times.get(s)[0],
      maxDate = $times.get(s)[1];
    let date = minDate;
    if ($currentDate >= minDate && $currentDate <= maxDate) {
      date = $currentDate;
    } else if ($currentDate > maxDate) {
      date = maxDate;
    }

    if (!$sensors.find(d => d.id === s).levels.includes($currentLevel)) {
      l = $sensors.find(d => d.id === s).levels[0];
      levelChangedWhenSensorChanged = true;
      currentRegion.set('');
      currentRegionName.set('');
      currentLevel.set(l);
    } else {
      // update regiondata
      updateTimeSliceCache(s, l, $currentRegion);
    }
    if (date !== $currentDate) {
      dateChangedWhenSensorChanged = true;
      currentDate.set(date);
    }

    updateRegionSliceCache(s, l, date, 'sensor-change');
  });

  currentLevel.subscribe(l => {
    if (levelChangedWhenSensorChanged) {
      levelChangedWhenSensorChanged = false;
    } else {
      currentRegion.set('');
      currentRegionName.set('');
      updateRegionSliceCache($currentSensor, l, $currentDate, 'level-change');
    }
  });

  currentDate.subscribe(d => {
    if (dateChangedWhenSensorChanged) {
      dateChangedWhenSensorChanged = false;
    } else {
      updateRegionSliceCache($currentSensor, $currentLevel, d, 'date-change');
    }
  });

  currentRegion.subscribe(r => {
    updateTimeSliceCache($currentSensor, $currentLevel, r);
    if (r) {
      toggleGraphShowStatus(null, true);
    } else {
      toggleGraphShowStatus(null, false);
    }
  });

  onMount(_ => {
    fetch(ENDPOINT_META)
      .then(d => d.json())
      .then(meta => {
        let timeMap = new Map();
        let statsMap = new Map();
        $sensors.forEach(s => {
          let matchedMeta = meta.epidata.find(
            d => d.data_source === s.id && d.signal === s.signal && d.time_type === 'day',
          );

          if (matchedMeta.max_time > yesterday) {
            matchedMeta.max_time = yesterday;
          }
          timeMap.set(s.id, [matchedMeta.min_time, matchedMeta.max_time]);
          statsMap.set(s.id, {
            mean: matchedMeta.mean_value,
            std: matchedMeta.stdev_value,
          });
        });

        stats.set(statsMap);
        times.set(timeMap);
        metaData.set(meta.epidata);

        let l = $currentLevel;
        if (!$sensors.find(d => d.id === $currentSensor).levels.includes($currentLevel)) {
          l = $sensors.find(d => d.id === $currentSensor).levels[0];
          currentLevel.set(l);
        }

        let date = timeMap.get($currentSensor)[1];
        // set to nearest available date
        dateChangedWhenSensorChanged = true;
        currentDate.set(date);

        let q =
          ENDPOINT +
          '&data_source=' +
          $currentSensor +
          '&signal=' +
          $sensors.find(d => d.id === $currentSensor).signal +
          '&geo_type=' +
          l +
          '&time_values=' +
          date +
          '&geo_value=*';
        fetch(q)
          .then(d => d.json())
          .then(d => {
            if (d.result < 0 || d.message.includes('no results')) {
              currentData.set([]);
              regionSliceCache.update(m => m.set($currentSensor + $currentLevel + date, []));
            } else {
              let { epidata } = d;
              epidata = epidata.map(item => {
                return { ...item, sensor: $currentSensor, level: l };
              });
              currentData.set(epidata);
              regionSliceCache.update(m => m.set($currentSensor + $currentLevel + date, d.epidata));
            }

            mounted.set(1);
          });
      });
  });
</script>

<style>
  .options-container {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1000;
    /* width: 220px; */
    background-color: rgba(255, 255, 255, 0.9);
    /* border-radius: 8px; */
    padding: 10px 10px;
    box-sizing: border-box;

    transition: all 0.1s ease-in;

    /* background-color: black; */
    /* border: 1px solid black; */
  }

  .tabs-container {
    position: absolute;
    top: 10px;
    left: 50px;
    right: 50px;
    z-index: 1000;
    /* max-width: 750px; */
    /* background-color: rgba(255, 255, 255, 0.9); */
    /* border-radius: 8px; */
    /* padding: 10px 10px; */
    box-sizing: border-box;

    transition: all 0.1s ease-in;

    pointer-events: none;

    /* background-color: black; */
    /* border: 1px solid black; */
  }

  .legend-container {
    position: absolute;
    top: 204px;
    left: 10px;
    z-index: 1000;
    /* background-color: rgba(255, 255, 255, 0.9); */

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    transition: all 0.1s ease-in;

    height: 40%;
  }

  .graph-container {
    /* border: 1px dotted black; */

    position: absolute;
    z-index: 1001;
    bottom: 10px;
    right: 10px;
    /* max-width: 400px;
    max-height: 400px;
    width: 400px; */
    background-color: rgba(255, 255, 255, 0.9);
    /* border-radius: 1rem; */
    padding: 5px 5px;
    box-sizing: border-box;

    transition: opacity 0.3s ease-in-out;

    visibility: hidden;
    opacity: 0;
  }

  .graph-container.show {
    visibility: visible;
    opacity: 1;
  }

  .hide-graph-button-anchor {
    position: relative;
  }

  .hide-graph-button {
    position: absolute;
    top: 0;
    left: 0;
    width: 14px;
    height: 14px;
    color: #333;
    font-size: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    background-color: transparent;
    padding: 0;
    border: 0;

    transition: opacity 0.1s ease-in;

    opacity: 0.7;
  }

  .hide-graph-button:hover {
    opacity: 1;
  }

  .graph-toggole-button-container {
    position: absolute;
    z-index: 1001;
    bottom: 10px;
    right: 10px;
    /* max-width: 400px;
    max-height: 400px;
    width: 400px; */
    background-color: rgba(255, 255, 255, 0.9);
    /* border-radius: 1rem; */
    padding: 5px 5px;
    box-sizing: border-box;
  }

  .graph-toggle-button {
    width: 30px;
    height: 30px;
    /* border-radius: 5px; */
    cursor: pointer;
    background-color: transparent;
    padding: 0;
    border: 0;

    transition: all 0.1s ease-in;

    position: relative;
  }

  .graph-toggle-button:hover {
    background-color: #eee;
  }

  img.toggle-button-icon {
    width: 24px;
    height: 24px;
    background: transparent;
  }

  button.graph-toggle-button .button-tooltip {
    visibility: hidden;
    width: 120px;
    border-style: solid;
    border-width: 1px;
    border-color: #666;
    background-color: #fff;
    color: #333;
    font-weight: 400;
    font-size: 14px;
    line-height: 14px;
    text-align: center;
    border-radius: 6px;
    padding: 5px 5px;
    position: absolute;
    z-index: 1;
    top: 0px;
    right: 120%;
  }

  button.graph-toggle-button .button-tooltip::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent transparent #666;
  }

  button.graph-toggle-button:hover .button-tooltip {
    visibility: visible;
  }

  .time-container {
    position: absolute;
    bottom: 10px;
    left: 10px;
    z-index: 1002;
    background-color: rgba(255, 255, 255, 0.9);
    /* border-radius: 8px; */
    padding: 30px 10px;
    box-sizing: border-box;
    /* width: 550px; */

    transition: all 0.1s ease-in;
  }

  .error-message-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    display: flex;
    justify-content: center;
    align-items: center;

    color: gray;
  }
</style>

{#if error}
  <div class="error-message-container">Failed to load data. Please try again later...</div>
{/if}

<MapBox />

<div class="tabs-container">
  <Tabs />
</div>

<div class="options-container">
  <Options />
</div>

<div class="legend-container">
  <Legend />
</div>

<div class="time-container">
  <Time />
</div>

<!-- need to add the $mapFirstLoaded check -->
{#if $mapFirstLoaded && !graphShowStatus}
  <div class="graph-toggole-button-container">
    <button
      title="Show graph"
      class="graph-toggle-button"
      aria-label="toggle graph"
      on:click={event => toggleGraphShowStatus(false)}>
      <span class="button-tooltip">Show time series</span>
      <img class="toggle-button-icon" src="./assets/imgs/line-graph-icon.png" alt="" />
    </button>
  </div>
{/if}

<!-- need to add the $mapFirstLoaded check -->
<div class="graph-container {$mapFirstLoaded && graphShowStatus ? 'show' : ''}">
  <div class="hide-graph-button-anchor">
    <button
      title="Hide time series"
      aria-label="toggle graph"
      on:click={toggleGraphShowStatus}
      class="hide-graph-button">
      &#10005;
    </button>
  </div>

  <Graph />
</div>
