<script>
  import { onMount } from 'svelte';
  import Options from './Options.svelte';
  import Time from './Time.svelte';
  import Legend from './Legend.svelte';
  import MapBox from './MapBox.svelte';
  import Graph from './Graph.svelte';

  import {
    sensorMap,
    times,
    stats,
    signalType,
    currentSensor,
    currentDate,
    currentLevel,
    currentRegion,
    currentRegionName,
    regionSliceCache,
    timeSliceCache,
    currentData,
    regionData,
    mounted,
    mapFirstLoaded,
    yesterday,
    customDataView,
  } from './stores.js';

  const ENDPOINT = 'https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day';
  const ENDPOINT_META = 'https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast_meta&cached=true';

  // Fix for IE: https://stackoverflow.com/a/21712356
  let isIE = window.document.documentMode;

  let error = null;
  let graphShowStatus = false;
  let changingSensor = false;
  let levelChangedWhenSensorChanged = false;
  let dateChangedWhenSensorChanged = false;
  let first_loaded = true;

  function callAPI(id, signal, level, date, region) {
    return fetch(
      ENDPOINT +
        '&data_source=' +
        id +
        '&signal=' +
        signal +
        '&geo_type=' +
        level +
        '&time_values=' +
        date +
        '&geo_value=' +
        region,
    ).then(d => d.json());
  }

  // combining json with same geolocations but different value properties
  // json1 value is 7 day average, json2 value is single count
  function extend(json1, json2) {
    var new_epidata = [];
    var data1 = json1.epidata;
    var data2 = json2.epidata;
    for (var i = 0; i < data1.length; i++) {
      var avg = Math.max(0, data1[i].value);
      var count = Math.max(0, data2[i].value);
      data1[i].avg = avg;
      delete data1[i].value;
      data1[i].count = count;
      new_epidata.push(data1[i]);
    }
    return new_epidata;
  }

  // We cache API calls for all regions at a given time and update currentData.
  function updateRegionSliceCache(sensor, level, date, reason = 'unspecified') {
    let sEntry = $sensorMap.get(sensor);
    if (!$mounted || !sEntry.levels.includes(level) || date > $times.get(sensor)[1] || reason === 'level change')
      return;
    let cacheEntry = $regionSliceCache.get(sensor + level + date);
    if (!cacheEntry) {
      callAPI(sEntry.id, sEntry.signal, level, date, '*').then(d => {
        if (d.result < 0 || d.message.includes('no results')) {
          currentData.set([]);
          regionSliceCache.update(m => m.set(sensor + level + date, []));
        } else {
          const death_regex = /deaths_/;
          const cases_regex = /confirmed_/;
          // deaths needs both count and ratio
          if (sEntry.signal.match(death_regex)) {
            // deaths_incidence_prop
            if (sEntry.signal === 'deaths_7dav_incidence_prop') {
              callAPI(sEntry.id, 'deaths_incidence_prop', level, date, '*').then(d1 => {
                var extended = extend(d, d1);
                currentData.set(extended);
                regionSliceCache.update(m => m.set(sensor + level + date, extended));
              });
            } else {
              callAPI(sEntry.id, 'deaths_incidence_num', level, date, '*').then(d1 => {
                var extended = extend(d, d1);
                currentData.set(extended);
                regionSliceCache.update(m => m.set(sensor + level + date, extended));
              });
            }
          }
          // cases needs both count and ratio
          else if (sEntry.signal.match(cases_regex)) {
            // confirmed_incidence_prop
            if (sEntry.signal === 'confirmed_7dav_incidence_prop') {
              callAPI(sEntry.id, 'confirmed_incidence_prop', level, date, '*').then(d1 => {
                var extended = extend(d, d1);
                currentData.set(extended);
                regionSliceCache.update(m => m.set(sensor + level + date, extended));
              });
            } else {
              callAPI(sEntry.id, 'confirmed_incidence_num', level, date, '*').then(d1 => {
                var extended = extend(d, d1);
                currentData.set(extended);
                regionSliceCache.update(m => m.set(sensor + level + date, extended));
              });
            }
          }
          // everything else
          else {
            currentData.set(d.epidata);
            regionSliceCache.update(m => m.set(sensor + level + date, d.epidata));
          }
        }
      });
    } else {
      currentData.set(cacheEntry);
    }
  }

  // We cache API calls for all time at a given region and update regionData.
  function updateTimeSliceCache(sensor, level, region) {
    let sEntry = $sensorMap.get(sensor);
    if (!$mounted) return;
    if (!region) {
      regionData.set([]);
      return;
    }

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

    let cacheEntry = $timeSliceCache.get(sensor + level + region);
    if (!cacheEntry) {
      callAPI(sEntry.id, sEntry.signal, level, '20100101-20500101', region).then(d => {
        // creating deepcopy to avoid tampering with the data stored in cache
        if (!checkIfCurrentRegionHasDataOnCurrentDate(d.epidata)) {
          currentRegion.set('');
          currentRegionName.set('');
          timeSliceCache.update(m => m.set(sensor + level + region, d.epidata));
        } else {
          const epi_data = JSON.parse(JSON.stringify(d.epidata));
          regionData.set(d.epidata);
          timeSliceCache.update(m => m.set(sensor + level + region, epi_data));
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

  // Since we don't want multiple updates, but currentSensor changes can update // the level and date, we have flags that prevent the async updates.
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

    if (!$sensorMap.get(s).levels.includes($currentLevel)) {
      l = $sensorMap.get(s).levels[0];
      levelChangedWhenSensorChanged = true;
      currentRegion.set('');
      currentRegionName.set('');
      currentLevel.set(l);
    } else {
      updateTimeSliceCache(s, l, $currentRegion);
    }
    if (date !== $currentDate) {
      dateChangedWhenSensorChanged = true;
      currentDate.set(date);
    }

    $sensorMap.get(s).official ? signalType.set('value') : '';

    updateRegionSliceCache(s, l, date, 'sensor-change');
  });

  currentLevel.subscribe(l => {
    if (levelChangedWhenSensorChanged) {
      levelChangedWhenSensorChanged = false;
    } else {
      if ($mounted) {
        currentRegion.set('');
        currentRegionName.set('');
      }
      updateRegionSliceCache($currentSensor, l, $currentDate, 'level-change');
    }
  });

  currentDate.subscribe(d => {
    dateChangedWhenSensorChanged
      ? (dateChangedWhenSensorChanged = false)
      : updateRegionSliceCache($currentSensor, $currentLevel, d, 'date-change');
  });

  currentRegion.subscribe(r => {
    updateTimeSliceCache($currentSensor, $currentLevel, r);
    if (first_loaded && r !== '') {
      toggleGraphShowStatus(null, false);
      first_loaded = false;
    } else if (r) {
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

        Array.from($sensorMap.keys()).forEach(sensorKey => {
          let sEntry = $sensorMap.get(sensorKey);
          let matchedMeta;
          // need to chagne mean / std for counts
          if (sEntry.signal.match(/num/)) {
            const regions = sEntry.levels;
            regions.forEach(region => {
              matchedMeta = meta.epidata.find(
                d =>
                  d.data_source === sEntry.id &&
                  d.signal === sEntry.signal &&
                  d.time_type === 'day' &&
                  d.geo_type === region,
              );
              if (matchedMeta) {
                if (matchedMeta.max_time > yesterday) {
                  matchedMeta.max_time = yesterday;
                }

                timeMap.set(sensorKey, [matchedMeta.min_time, matchedMeta.max_time]);

                statsMap.set(sensorKey + '_' + region, {
                  mean: matchedMeta.mean_value,
                  std: matchedMeta.stdev_value,
                });
              } else {
                // If no metadata, use information from sensors
                // Used for testing new data
                timeMap.set(sensorKey, [sEntry.minTime, sEntry.maxTime]);
                if (region === 'county') {
                  statsMap.set(sensorKey + '_' + region, {
                    mean: sEntry.county_mean,
                    std: sEntry.county_std,
                  });
                } else if (region === 'msa') {
                  statsMap.set(sensorKey + '_' + region, {
                    mean: sEntry.msa_mean,
                    std: sEntry.msa_std,
                  });
                } else {
                  statsMap.set(sensorKey + '_' + region, {
                    mean: sEntry.state_mean,
                    std: sEntry.state_std,
                  });
                }
              }
            });
          } else {
            matchedMeta = meta.epidata.find(
              d => d.data_source === sEntry.id && d.signal === sEntry.signal && d.time_type === 'day',
            );
            if (matchedMeta) {
              if (matchedMeta.max_time > yesterday) {
                matchedMeta.max_time = yesterday;
              }

              timeMap.set(sensorKey, [matchedMeta.min_time, matchedMeta.max_time]);

              statsMap.set(sensorKey, {
                mean: matchedMeta.mean_value,
                std: matchedMeta.stdev_value,
              });
            } else {
              // If no metadata, use information from sensors
              // Used for testing new data
              timeMap.set(sensorKey, [sEntry.minTime, sEntry.maxTime]);
              statsMap.set(sensorKey, {
                mean: sEntry.mean,
                std: sEntry.std,
              });
            }
          }
        });

        stats.set(statsMap);
        times.set(timeMap);

        let l = $currentLevel;
        if (!$sensorMap.get($currentSensor).levels.includes($currentLevel)) {
          l = $sensorMap.get($currentSensor).levels[0];
          currentLevel.set(l);
        }

        let date = $currentDate;
        // Magic number of default date - if no URL params, use max date
        // available
        if (date === 20100420) {
          date = timeMap.get($currentSensor)[1];
          currentDate.set(date);
        }

        mounted.set(1);
        updateRegionSliceCache($currentSensor, l, date);
        if ($currentRegion) {
          updateTimeSliceCache($currentSensor, $currentLevel, $currentRegion);
        }
      });
  });

  function toggleGraphShowStatus(event, to = null) {
    if (to !== null) {
      graphShowStatus = to;
    } else {
      graphShowStatus = !graphShowStatus;
    }
  }

  // Constantly keep the URL parameters updated with the current state.
  function updateURIParameters(sensor, level, region, date, signalType) {
    let pre = '';
    if ($customDataView) {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      pre = 'sensors=' + urlParams.get('sensors') + '&';
    }
    window.history.replaceState(
      {},
      document.title,
      '?' +
        pre +
        'sensor=' +
        sensor +
        '&level=' +
        level +
        '&region=' +
        region +
        '&date=' +
        date +
        '&signalType=' +
        signalType,
    );
  }

  // Keep the URL updated with the current state
  currentSensor.subscribe(s => updateURIParameters(s, $currentLevel, $currentRegion, $currentDate, $signalType));
  currentLevel.subscribe(l => updateURIParameters($currentSensor, l, $currentRegion, $currentDate, $signalType));
  currentRegion.subscribe(r => updateURIParameters($currentSensor, $currentLevel, r, $currentDate, $signalType));
  currentDate.subscribe(d => updateURIParameters($currentSensor, $currentLevel, $currentRegion, d, $signalType));
  signalType.subscribe(t => updateURIParameters($currentSensor, $currentLevel, $currentRegion, $currentDate, t));
</script>

<style>
  .options-container {
    position: absolute;
    top: 110px;
    left: 10px;
    max-width: 210px;
    z-index: 1001;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 10px 10px;
    box-sizing: border-box;
    transition: all 0.1s ease-in;
  }

  .legend-container {
    position: absolute;
    top: 315px;
    left: 10px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease-in;
    height: 35%;
  }

  .graph-container {
    position: absolute;
    z-index: 1001;
    bottom: 0px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.9);
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
    bottom: 0px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 5px 5px;
    box-sizing: border-box;
  }

  .graph-toggle-button {
    width: 85px;
    height: 40px;
    font-size: 14px;
    cursor: pointer;
    color: #333;
    background-color: transparent;
    padding: 0;
    border: 0;
    transition: all 0.1s ease-in;
    position: relative;
  }

  .graph-toggle-button:hover {
    background-color: #eee;
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
    bottom: 0px;
    left: 10px;
    z-index: 1002;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 30px 10px;
    box-sizing: border-box;
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

<div class="options-container">
  <Options {isIE} />
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
      title={isIE !== undefined ? 'Show time series' : ''}
      class="graph-toggle-button"
      aria-label="show time series"
      on:click={event => toggleGraphShowStatus(false)}>
      <span class="button-tooltip">Show time series</span>
      <b>View Time Graph</b>
    </button>
  </div>
{/if}

<!-- need to add the $mapFirstLoaded check -->
<div class="graph-container {$mapFirstLoaded && graphShowStatus ? 'show' : ''}">
  <div class="hide-graph-button-anchor">
    <button
      title="Hide time series"
      aria-label="Hide time series"
      on:click={toggleGraphShowStatus}
      class="hide-graph-button">
      &#10005;
    </button>
  </div>

  <Graph />
</div>
