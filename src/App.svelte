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
  let changingSensor = false;

  // this is for graph dev purposes
  let use_real_data = true;

  // if (use_real_data === false) {
  //   console.log('using fake network requests');
  //   onMount(_ => {
  //     d3.json('./temp_graph_data/meta_request_results.json').then(meta => {
  //       metaStats.set(meta.epidata);

  //       let queries = [];
  //       let entries = [];
  //       let timeMap = new Map();
  //       $sensors.forEach(sens => {
  //         let date = meta.epidata.find(d => d.data_source === sens.id);
  //         let minDate = date.min_time;
  //         let maxDate = date.max_time;
  //         timeMap.set(sens.id, [minDate, maxDate]);
  //         sens.levels.forEach(l => {
  //           entries.push([sens.id, l]);
  //         });
  //       });

  //       // faking queries with d3.json()
  //       queries.push(d3.json('./temp_graph_data/fb_survey_cli_county_20200406-20200413.json'));
  //       queries.push(d3.json('./temp_graph_data/fb_survey_cli_msa_20200406-20200413.json'));
  //       queries.push(d3.json('./temp_graph_data/google-survey_cli_county_20200411-20200416.json'));
  //       queries.push(d3.json('./temp_graph_data/quidel_negativeratio_county_20200201-20200409.json'));
  //       queries.push(d3.json('./temp_graph_data/quidel_negativeratio_msa_20200201-20200409.json'));
  //       queries.push(d3.json('./temp_graph_data/ght_smoothedsearch_msa_20200201-20200412.json'));

  //       let dat = {};
  //       Promise.all(queries).then(d => {
  //         console.log(d);
  //         entries.forEach((ent, i) => {
  //           dat[ent[0]] ? '' : (dat[ent[0]] = {});
  //           dat[ent[0]][ent[1]] = d[i].epidata;
  //         });
  //         times.set(timeMap);
  //         data.set(dat);
  //       });
  //     });
  //   }).catch(err => {
  //     error = err;
  //     currentDataReadyOnMay.set(true);
  //   });
  // }

  function updateRegionSliceCache(sensor, level, date, reason = 'unspecified') {
    console.log($regionSliceCache);
    if (!$mounted) return;
    console.log(sensor, level, date, $times.get(sensor));
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
          console.log(reason, q, d);
          if (d.result < 0 || d.message.includes('no results')) {
            console.log('bad api call, not updating regionSliceCache');
            currentData.set([]);
            regionSliceCache.update(m => m.set(sensor + level + date, []));
          } else {
            currentData.set(d.epidata);
            regionSliceCache.update(m => m.set(sensor + level + date, d.epidata));
          }
        });
    } else {
      console.log(reason, 'got in cache');
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

  let levelChangedWhenSensorChanged = false;
  let dateChangedWhenSensorChanged = false;

  currentSensor.subscribe(s => {
    if (!$mounted) return;
    // facebook fix
    if (s === 'fb_survey') {
      signalType.set('value');
    }

    let l = $currentLevel;
    let date = $times.get(s)[1];

    if (!$sensors.find(d => d.id === s).levels.includes($currentLevel)) {
      console.log('update?');
      l = $sensors.find(d => d.id === s).levels[0];
      levelChangedWhenSensorChanged = true;
      currentLevel.set(l);
    }
    if (date !== $currentDate) {
      console.log('now?');
      dateChangedWhenSensorChanged = true;
      currentDate.set(date);
    }

    updateRegionSliceCache(s, l, date, 'sensor-change');
  });

  currentLevel.subscribe(l => {
    console.log('level update');
    if (levelChangedWhenSensorChanged) {
      levelChangedWhenSensorChanged = false;
    } else {
      updateRegionSliceCache($currentSensor, l, $currentDate, 'level-change');
    }
  });

  currentDate.subscribe(d => {
    console.log('date update');
    if (dateChangedWhenSensorChanged) {
      dateChangedWhenSensorChanged = false;
    } else {
      updateRegionSliceCache($currentSensor, $currentLevel, d, 'date-change');
    }
  });

  currentRegion.subscribe(r => {
    console.log('update region');
    updateTimeSliceCache($currentSensor, $currentLevel, r);
  });

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

          let l = $currentLevel;
          if (!$sensors.find(d => d.id === $currentSensor).levels.includes($currentLevel)) {
            console.log('update?');
            l = $sensors.find(d => d.id === $currentSensor).levels[0];
            currentLevel.set(l);
          }

          let q =
            ENDPOINT +
            '&data_source=' +
            $currentSensor +
            '&signal=' +
            $sensors.find(d => d.id === $currentSensor).signal +
            '&geo_type=' +
            l +
            '&time_values=' +
            timeMap.get($currentSensor)[1] +
            '&geo_value=*';
          fetch(q)
            .then(d => d.json())
            .then(d => {
              console.log(q, d);
              if (d.result < 0 || d.message.includes('no results')) {
                console.log('bad api call, not updating regionSliceCache');
                currentData.set([]);
                regionSliceCache.update(m =>
                  m.set($currentSensor + $currentLevel + timeMap.get($currentSensor)[1], []),
                );
              } else {
                currentData.set(d.epidata);
                regionSliceCache.update(m =>
                  m.set($currentSensor + $currentLevel + timeMap.get($currentSensor)[1], d.epidata),
                );
              }

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
    /* width: 220px; */
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
    top: 240px;
    left: 10px;
    z-index: 1000;
    /* background-color: rgba(255, 255, 255, 0.7); */

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    transition: all 0.1s ease-in;

    height: 40%;
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
    bottom: 10px;
    left: 10px;
    z-index: 1002;
    background-color: rgba(255, 255, 255, 0.7);
    /* border-radius: 8px; */
    padding: 30px 10px;
    box-sizing: border-box;
    /* width: 550px; */

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
  <Time {updateRegionSliceCache} />
</div>

<div class="graph-container">
  <Graph />
</div>
