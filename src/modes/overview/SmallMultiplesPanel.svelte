<script>
  import SmallMultiples from './SmallMultiples.svelte';
  import {
    // currentRegion,
    // currentLevel,
    // currentSensorEntry,
    publicSensors,
    earlySensors,
    lateSensors,
    currentRegionInfo,
    currentSensor,
  } from '../../stores';
  // import { parseAPITime } from '../../data/utils';
  // import { fetchCustomTimeSlice } from '../../data/fetchData';
  // import singleLineChartSpec from '../../components/vega/SmallMultipleSingleLineChart.json';
  import IoIosArrowForward from 'svelte-icons/io/IoIosArrowForward.svelte';
  import IoMdMap from 'svelte-icons/io/IoMdMap.svelte';
  import IoMdExpand from 'svelte-icons/io/IoMdExpand.svelte';

  // Create a date for today in the API's date format
  // const startDay = parseAPITime('20200401');
  // const finalDay = new Date();

  let collapsed = [
    'ght-smoothed_search',
    'fb-survey-smoothed_hh_cmnty_cli',
    'indicator-combination-confirmed_7dav_incidence_num',
    'indicator-combination-deaths_7dav_incidence_num',
    'safegraph-full_time_work_prop',
    'safegraph-part_time_work_prop',
  ];
  let collapsedGroup = [];

  function toggleCollapsed(sensor) {
    if (collapsed.includes(sensor)) {
      collapsed = collapsed.filter((d) => d !== sensor);
    } else {
      collapsed = [...collapsed, sensor];
    }
  }

  function toggleCollapsedGroup(group) {
    if (collapsedGroup.includes(group)) {
      collapsedGroup = collapsedGroup.filter((d) => d !== group);
    } else {
      collapsedGroup = [...collapsedGroup, group];
    }
  }

  $: smSensors = [
    {
      id: 'public',
      label: 'Public Behavior',
      sensors: $publicSensors,
    },
    {
      id: 'early',
      label: 'Early Indicators',
      sensors: $earlySensors,
    },
    {
      id: 'late',
      label: 'Late Indicators',
      sensors: $lateSensors,
    },
  ];
</script>

<style>
  ul {
    list-style-type: none;
    padding: 0 0 0 0.25em;
  }

  li {
    margin: 0;
  }

  .header {
    display: flex;
    align-items: center;
    padding-bottom: 0.2em;
    cursor: pointer;
  }

  h4,
  h5 {
    flex: 1 1 0;
    padding: 0;
  }

  .toolbar {
    display: flex;
    font-size: 0.7rem;
  }

  .toggle {
    width: 1.2em;
    height: 1.2em;
    position: relative;
    transition: transform 0.25s ease;
    transform: rotate(90deg);
  }

  .collapsed {
    padding-bottom: 0;
  }
  .collapsed .toggle {
    transform: rotate(0deg);
  }

  .collapsed > .collapsed-body {
    display: none;
  }
</style>

<h3>{$currentRegionInfo ? $currentRegionInfo.display_name : 'No Region Selected'}</h3>
<ul class="root">
  {#each smSensors as sensorGroup}
    <li class:collapsed={collapsedGroup.includes(sensorGroup.id)}>
      <div class="header" on:click={() => toggleCollapsedGroup(sensorGroup.id)}>
        <span class="toggle">
          <IoIosArrowForward />
        </span>
        <h4>{sensorGroup.label}</h4>
      </div>
      <ul class="collapsed-body">
        {#each sensorGroup.sensors as sensor}
          <li class:collapsed={collapsed.includes(sensor.key)} data-id={sensor.key}>
            <div class="header" title={sensor.tooltipText} on:click={() => toggleCollapsed(sensor.key)}>
              <span class="toggle">
                <IoIosArrowForward />
              </span>
              <h5>{sensor.name}</h5>
              <div class="toolbar">
                <button
                  class="pg-button"
                  title="Show in Map"
                  on:click={() => currentSensor.set(sensor.key)}
                  class:active={$currentSensor === sensor.key}
                  disabled={$currentSensor === sensor.key}>
                  <IoMdMap />
                </button>
                <button class="pg-button">
                  <IoMdExpand />
                </button>
              </div>
            </div>
            <div class="collapsed-body">
              {#if !collapsed.includes(sensor.key) && !collapsedGroup.includes(sensorGroup.id)}
                <SmallMultiples {sensor} />
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </li>
  {/each}
</ul>
