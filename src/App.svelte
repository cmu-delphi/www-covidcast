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
    mapfirstLoaded,
  } from './stores.js';

  import * as d3 from 'd3';

  const ENDPOINT = 'https://delphi.cmu.edu/epidata/api.php?source=covidcast&time_type=day';
  const ENDPOINT_META = 'https://delphi.cmu.edu/epidata/api.php?source=covidcast_meta';

  let error = null;
  let changingSensor = false;

  function updateRegionSliceCache(sensor, level, date, reason = 'unspecified') {
    //console.log($regionSliceCache);
    if (!$mounted) return;
    //console.log(sensor, level, date, $times.get(sensor));
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
          // console.log(reason, q, d);
          if (d.result < 0 || d.message.includes('no results')) {
            //console.log('bad api call, not updating regionSliceCache');
            currentData.set([]);
            regionSliceCache.update(m => m.set(sensor + level + date, []));
          } else {
            // attach signature
            let { epidata } = d;
            epidata = epidata.map(item => {
              return { ...item, sensor, level };
            });
            currentData.set(epidata);
            regionSliceCache.update(m => m.set(sensor + level + date, d.epidata));
          }
        });
    } else {
      //console.log(reason, 'got in cache');
      currentData.set(cacheEntry);
    }
  }

  function updateTimeSliceCache(sensor, level, region) {
    //console.log(region);
    //console.log($mounted);
    if (!$mounted) return;
    if (!region) {
      regionData.set([]);
      return;
    }
    let cacheEntry = $timeSliceCache.get(sensor + level + region);
    //console.log(cacheEntry);
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
          //console.log(q, d);
          regionData.set(d.epidata);
          timeSliceCache.update(m => m.set(sensor + level + region, d.epidata));
        });
    } else regionData.set(cacheEntry);
  }

  let levelChangedWhenSensorChanged = false;
  let dateChangedWhenSensorChanged = false;

  currentSensor.subscribe(s => {
    if (!$mounted) return;

    let l = $currentLevel;
    let minDate = $times.get(s)[0],
      maxDate = $times.get(s)[1];
    // console.log(minDate, maxDate);
    let date = minDate;
    if ($currentDate >= minDate && $currentDate <= maxDate) {
      // data available at current date
      date = $currentDate;
    }
    // console.log(date);

    if (!$sensors.find(d => d.id === s).levels.includes($currentLevel)) {
      //console.log('update?');
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
      //console.log('now?');
      dateChangedWhenSensorChanged = true;
      currentDate.set(date);
    }

    updateRegionSliceCache(s, l, date, 'sensor-change');
  });

  currentLevel.subscribe(l => {
    //console.log('level update');
    if (levelChangedWhenSensorChanged) {
      levelChangedWhenSensorChanged = false;
    } else {
      currentRegion.set('');
      currentRegionName.set('');
      updateRegionSliceCache($currentSensor, l, $currentDate, 'level-change');
    }
  });

  currentDate.subscribe(d => {
    //console.log('date update');
    if (dateChangedWhenSensorChanged) {
      dateChangedWhenSensorChanged = false;
    } else {
      updateRegionSliceCache($currentSensor, $currentLevel, d, 'date-change');
    }
  });

  currentRegion.subscribe(r => {
    //console.log('update region');
    updateTimeSliceCache($currentSensor, $currentLevel, r);
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
          //console.log(s, matchedMeta);
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
          //console.log('update?');
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
            //console.log(q, d);
            if (d.result < 0 || d.message.includes('no results')) {
              //console.log('bad api call, not updating regionSliceCache');
              currentData.set([]);
              regionSliceCache.update(m => m.set($currentSensor + $currentLevel + date, []));
            } else {
              // attach signature
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

    display: flex;
    justify-content: center;
    align-items: center;

    transition: all 0.1s ease-in;

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
    position: absolute;
    z-index: 1001;
    bottom: 10px;
    right: 10px;
    max-width: 400px;
    max-height: 400px;
    width: 400px;
    background-color: rgba(255, 255, 255, 0.9);
    /* border-radius: 1rem; */
    padding: 6px 13px 0;
    box-sizing: border-box;

    transition: opacity 0.3s ease-in-out;

    visibility: hidden;
    opacity: 0;
  }

  .graph-container.show {
    visibility: unset;
    opacity: 1;
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

<div class="graph-container {$mapfirstLoaded ? 'show' : ''}">
  <Graph />
</div>
