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
    signalType,
    currentRange,
    currentSensor,
    currentDate,
    currentLevel,
    currentRegion,
    regionSliceCache,
    timeSliceCache,
    currentData,
    regionData,
    metaData,
    mounted,
  } from './stores.js';

  import * as d3 from 'd3';

  const ENDPOINT = 'https://delphi.cmu.edu/epidata/api.php?source=covidcast&time_type=day';
  const ENDPOINT_META = 'https://delphi.cmu.edu/epidata/api.php?source=covidcast_meta';

  let error = null;

  // this is for graph dev purposes
  let use_real_data = true;

  if (use_real_data === false) {
    console.log('using fake network requests');
    onMount(_ => {
      d3.json('./temp_graph_data/meta_request_results.json').then(meta => {
        metaStats.set(meta.epidata);

        let queries = [];
        let entries = [];
        let timeMap = new Map();
        $sensors.forEach(sens => {
          let date = meta.epidata.find(d => d.data_source === sens.id);
          let minDate = date.min_time;
          let maxDate = date.max_time;
          timeMap.set(sens.id, [minDate, maxDate]);
          sens.levels.forEach(l => {
            entries.push([sens.id, l]);
          });
        });

        // faking queries with d3.json()
        queries.push(d3.json('./temp_graph_data/fb_survey_cli_county_20200406-20200413.json'));
        queries.push(d3.json('./temp_graph_data/fb_survey_cli_msa_20200406-20200413.json'));
        queries.push(d3.json('./temp_graph_data/google-survey_cli_county_20200411-20200416.json'));
        queries.push(d3.json('./temp_graph_data/quidel_negativeratio_county_20200201-20200409.json'));
        queries.push(d3.json('./temp_graph_data/quidel_negativeratio_msa_20200201-20200409.json'));
        queries.push(d3.json('./temp_graph_data/ght_smoothedsearch_msa_20200201-20200412.json'));

        let dat = {};
        Promise.all(queries).then(d => {
          console.log(d);
          entries.forEach((ent, i) => {
            dat[ent[0]] ? '' : (dat[ent[0]] = {});
            dat[ent[0]][ent[1]] = d[i].epidata;
          });
          times.set(timeMap);
          data.set(dat);
        });
      });
    }).catch(err => {
      error = err;
      currentDataReadyOnMay.set(true);
    });
  }

  function updateRegionSliceCache(sensor, level, date) {
    if (!$mounted) return;
    let dateRange = $times.get(sensor);
    if (date > dateRange[1]) {
      date = dateRange[1];
      currentDate.set(date);
    }
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
          currentData.set(d.epidata);
          regionSliceCache.update(m => m.set(sensor + level + date, d.epidata));
        });
    } else currentData.set(cacheEntry);
  }

  function updateTimeSliceCache(sensor, level, region) {
    if (!$mounted) return;
    if (!$currentRegion) {
      currentData.set([]);
      return;
    }
    let cacheEntry = $timeSliceCache.get(sensor + level + region);
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
          regionData.set(d.epidata);
          timeSliceCache.update(m => m.set(sensor + level + region, d.epidata));
        });
    } else regionData.set(cacheEntry);
  }

  currentSensor.subscribe(s => {
    updateRegionSliceCache(s, $currentLevel, $currentDate);
    updateTimeSliceCache(s, $currentLevel, $currentRegion);
  });
  currentLevel.subscribe(l => {
    updateRegionSliceCache($currentSensor, l, $currentDate);
    updateRegionSliceCache($currentSensor, l, $currentRegion);
  });
  currentDate.subscribe(d => updateRegionSliceCache($currentSensor, $currentLevel, d));
  currentRegion.subscribe(r => updateTimeSliceCache($currentSensor, $currentLevel, r));

  if (use_real_data) {
    onMount(_ => {
      fetch(ENDPOINT_META)
        .then(d => d.json())
        .then(meta => {
          metaData.set(meta.epidata);
          let timeMap = new Map();
          $sensors.forEach(s => {
            let matchedMeta = meta.epidata.find(
              d => d.data_source === s.id && d.signal === s.signal && d.time_type === 'day',
            );
            timeMap.set(s.id, [matchedMeta.min_time, matchedMeta.max_time]);
          });
          times.set(timeMap);
          fetch(
            ENDPOINT +
              '&data_source=' +
              $currentSensor +
              '&signal=' +
              $sensors.find(d => d.id === $currentSensor).signal +
              '&geo_type=' +
              $currentLevel +
              '&time_values=' +
              timeMap.get($currentSensor)[1] +
              '&geo_value=*',
          )
            .then(d => d.json())
            .then(d => {
              regionSliceCache.update(m =>
                m.set($currentSensor + $currentLevel + timeMap.get($currentSensor)[1], d.epidata),
              );
              currentData.set(d.epidata);
              mounted.set(1);
            });
        });
    });
  }
</script>

<style>
  .options-container {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1000;
    width: 250px;
    background-color: rgba(255, 255, 255, 0.7);
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
    /* background-color: rgba(255, 255, 255, 0.7); */
    /* border-radius: 8px; */
    padding: 10px 10px;
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
    top: 200px;
    bottom: 160px;
    left: 20px;
    z-index: 1000;
    /* background-color: rgba(255, 255, 255, 0.7); */

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    transition: all 0.1s ease-in;
  }

  .graph-container {
    position: absolute;
    bottom: 2vh;
    right: 2vh;
    z-index: 1001;
    max-width: 400px;
    width: 400px;
    background-color: rgba(255, 255, 255, 0.7);
    /* border-radius: 1rem; */
    padding: 10px 15px;
    box-sizing: border-box;

    transition: all 0.1s ease-in;
  }

  .time-container {
    position: absolute;
    bottom: 40px;
    left: 20px;
    z-index: 1002;
    /* background-color: rgba(255, 255, 255, 0.7); */
    /* border-radius: 8px; */
    padding: 5px 10px;
    box-sizing: border-box;
    width: 500px;

    transition: all 0.1s ease-in;
  }

  .options-container:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }

  /* .options-container:hover,
  .time-container:hover,
  .graph-container:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }  */

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

<div class="options-container">
  <Options />
</div>

<div class="tabs-container">
  <Tabs />
</div>

<div class="time-container">
  <Time />
</div>

<div class="legend-container">
  <Legend />
</div>

<div class="graph-container">
  <Graph />
</div>
