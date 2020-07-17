<script>
  import { onMount } from 'svelte';
  import MapBox from './MapBox.svelte';

  import {
    sensorMap,
    times,
    stats,
    signalType,
    encoding,
    currentSensor,
    currentDate,
    currentLevel,
    currentRegion,
    currentZone,
    currentRegionName,
    currentDataReadyOnMap,
    regionSliceCache,
    timeSliceCache,
    currentData,
    regionData,
    mounted,
    yesterday,
    customDataView,
  } from '../stores';

  const ENDPOINT = 'https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day';
  const ENDPOINT_META = 'https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast_meta&cached=true';

  // Fix for IE: https://stackoverflow.com/a/21712356
  let isIE = window.document.documentMode;

  let error = null;
  let graphShowStatus = false;
  let levelChangedWhenSensorChanged = false;
  let dateChangedWhenSensorChanged = false;
  let firstLoaded = true;

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
    ).then((d) => d.json());
  }

  // combining json with same geolocations but different value properties
  // json1 value is 7 day average, json2 value is single count
  function extend(json1, json2) {
    let newEpiData = [];
    let data1 = json1.epidata;
    let data2 = json2.epidata;
    for (let i = 0; i < data1.length; i++) {
      let avg = Math.max(0, data1[i].value);
      let count = Math.max(0, data2[i].value);
      data1[i].avg = avg;
      delete data1[i].value;
      data1[i].count = count;
      newEpiData.push(data1[i]);
    }
    return newEpiData;
  }

  function check_wip(signalName, otherSignal) {
    if (signalName.match(/wip/)) {
      return 'wip_' + otherSignal.replace('incidence', 'incid');
    }
    return otherSignal;
  }
  // We cache API calls for all regions at a given time and update currentData.
  function updateRegionSliceCache(sensor, level, date, reason = 'unspecified') {
    let sEntry = $sensorMap.get(sensor);
    if (!$mounted || !sEntry.levels.includes(level) || date > $times.get(sensor)[1] || reason === 'level change')
      return;
    let cacheEntry = $regionSliceCache.get(sensor + level + date);
    if (!cacheEntry) {
      callAPI(sEntry.id, sEntry.signal, level, date, '*').then((d) => {
        if (d.result < 0 || d.message.includes('no results')) {
          currentData.set([]);
          regionSliceCache.update((m) => m.set(sensor + level + date, []));
        } else {
          const deathsRegex = /deaths_/;
          const casesRegex = /confirmed_/;
          // deaths needs both count and ratio
          if (sEntry.signal.match(deathsRegex)) {
            // deaths_incidence_prop
            if (sEntry.signal === 'deaths_7dav_incidence_prop') {
              callAPI(sEntry.id, check_wip(sEntry.signal, 'deaths_incidence_prop'), level, date, '*').then((d1) => {
                let extended = extend(d, d1);
                currentData.set(extended);
                regionSliceCache.update((m) => m.set(sensor + level + date, extended));
              });
            } else {
              callAPI(sEntry.id, check_wip(sEntry.signal, 'deaths_incidence_num'), level, date, '*').then((d1) => {
                let extended = extend(d, d1);
                currentData.set(extended);
                regionSliceCache.update((m) => m.set(sensor + level + date, extended));
              });
            }
          }
          // cases needs both count and ratio
          else if (sEntry.signal.match(casesRegex)) {
            // confirmed_incidence_prop
            if (sEntry.signal === 'confirmed_7dav_incidence_prop') {
              callAPI(sEntry.id, check_wip(sEntry.signal, 'confirmed_incidence_prop'), level, date, '*').then((d1) => {
                let extended = extend(d, d1);
                currentData.set(extended);
                regionSliceCache.update((m) => m.set(sensor + level + date, extended));
              });
            } else {
              callAPI(sEntry.id, check_wip(sEntry.signal, 'confirmed_incidence_num'), level, date, '*').then((d1) => {
                let extended = extend(d, d1);
                currentData.set(extended);
                regionSliceCache.update((m) => m.set(sensor + level + date, extended));
              });
            }
          }
          // everything else
          else {
            currentData.set(d.epidata);
            regionSliceCache.update((m) => m.set(sensor + level + date, d.epidata));
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
    const checkIfCurrentRegionHasDataOnCurrentDate = (regionData = []) => {
      let flag = false;
      regionData.forEach((item) => {
        if (item.time_value == $currentDate) {
          flag = true;
        }
      });
      return flag;
    };

    let cacheEntry = $timeSliceCache.get(sensor + level + region);
    if (!cacheEntry) {
      callAPI(sEntry.id, sEntry.signal, level, '20100101-20500101', region).then((d) => {
        // creating deepcopy to avoid tampering with the data stored in cache
        if (!checkIfCurrentRegionHasDataOnCurrentDate(d.epidata)) {
          currentRegion.set('');
          currentRegionName.set('');
          timeSliceCache.update((m) => m.set(sensor + level + region, d.epidata));
        } else {
          const epi_data = JSON.parse(JSON.stringify(d.epidata));
          regionData.set(d.epidata);
          timeSliceCache.update((m) => m.set(sensor + level + region, epi_data));
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
  currentSensor.subscribe((s) => {
    $currentDataReadyOnMap = false;

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
    // reset encoding
    if (!s.match(/num/)) {
      $encoding = 'color';
    }
    if (date !== $currentDate) {
      dateChangedWhenSensorChanged = true;
      currentDate.set(date);
    }

    $sensorMap.get(s).official ? signalType.set('value') : '';

    updateRegionSliceCache(s, l, date, 'sensor-change');
  });

  currentLevel.subscribe((l) => {
    // eslint-disable-next-line no-unused-vars
    $currentDataReadyOnMap = false;

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

  currentDate.subscribe((d) => {
    dateChangedWhenSensorChanged
      ? (dateChangedWhenSensorChanged = false)
      : updateRegionSliceCache($currentSensor, $currentLevel, d, 'date-change');
  });

  currentRegion.subscribe((r) => {
    updateTimeSliceCache($currentSensor, $currentLevel, r);
    if (firstLoaded && r !== '') {
      toggleGraphShowStatus(null, false);
      firstLoaded = false;
    } else if (r) {
      toggleGraphShowStatus(null, true);
    } else {
      toggleGraphShowStatus(null, false);
    }
  });

  onMount(() => {
    fetch(ENDPOINT_META)
      .then((d) => d.json())
      .then((meta) => {
        let timeMap = new Map();
        let statsMap = new Map();

        Array.from($sensorMap.keys()).forEach((sensorKey) => {
          let sEntry = $sensorMap.get(sensorKey);
          let matchedMeta;
          // need to chagne mean / std for counts
          if (sEntry.signal.match(/num/)) {
            const regions = sEntry.levels;
            regions.forEach((region) => {
              matchedMeta = meta.epidata.find(
                (d) =>
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
              (d) => d.data_source === sEntry.id && d.signal === sEntry.signal && d.time_type === 'day',
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
  function updateURIParameters(sensor, level, region, date, signalType, encoding, zone) {
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
        signalType +
        '&encoding=' +
        encoding +
        (zone ? '&zone=' + zone : ''),
    );
  }

  // Keep the URL updated with the current state
  currentSensor.subscribe((s) =>
    updateURIParameters(s, $currentLevel, $currentRegion, $currentDate, $signalType, $encoding, $currentZone),
  );
  currentLevel.subscribe((l) =>
    updateURIParameters($currentSensor, l, $currentRegion, $currentDate, $signalType, $encoding, $currentZone),
  );
  currentRegion.subscribe((r) =>
    updateURIParameters($currentSensor, $currentLevel, r, $currentDate, $signalType, $encoding, $currentZone),
  );
  currentDate.subscribe((d) =>
    updateURIParameters($currentSensor, $currentLevel, $currentRegion, d, $signalType, $encoding, $currentZone),
  );
  signalType.subscribe((t) =>
    updateURIParameters($currentSensor, $currentLevel, $currentRegion, $currentDate, t, $encoding, $currentZone),
  );
  encoding.subscribe((e) =>
    updateURIParameters($currentSensor, $currentLevel, $currentRegion, $currentDate, $signalType, e, $currentZone),
  );
  currentZone.subscribe((z) =>
    updateURIParameters($currentSensor, $currentLevel, $currentRegion, $currentDate, $signalType, $encoding, z),
  );
</script>

<style>
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

<MapBox {isIE} {graphShowStatus} {toggleGraphShowStatus} />
