<script>
  import SmallMultiples from './SmallMultiples.svelte';
  import {
    // currentRegion,
    // currentLevel,
    // currentSensorEntry,
    publicSensors,
    earlySensors,
    lateSensors,
    currentRegionName,
  } from '../../stores';
  // import { parseAPITime } from '../../data/utils';
  // import { fetchCustomTimeSlice } from '../../data/fetchData';
  // import singleLineChartSpec from '../../components/vega/SmallMultipleSingleLineChart.json';
  import IoIosArrowForward from 'svelte-icons/io/IoIosArrowForward.svelte';

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

  h4,
  h5 {
    display: flex;
    align-items: center;
    padding-bottom: 0.2em;
    cursor: pointer;
  }

  h4 > span,
  h5 > span {
    width: 1.2em;
    height: 1.2em;
    position: relative;
    transition: transform 0.25s ease;
    transform: rotate(90deg);
  }

  .collapsed {
    padding-bottom: 0;
  }
  .collapsed > h4,
  .collapsed > h5 {
    padding-bottom: 0;
  }
  .collapsed > h4 > span,
  .collapsed > h5 > span {
    transform: rotate(0deg);
  }

  .collapsed > div,
  .collapsed > ul {
    display: none;
  }
</style>

<h3>{$currentRegionName || 'No Region Selected'}</h3>
<ul class="root">
  {#each smSensors as sensorGroup}
    <li class:collapsed={collapsedGroup.includes(sensorGroup.id)}>
      <h4 on:click={() => toggleCollapsedGroup(sensorGroup.id)}>
        <span>
          <IoIosArrowForward />
        </span>
        {sensorGroup.label}
      </h4>
      <ul>
        {#each sensorGroup.sensors as sensor}
          <li class:collapsed={collapsed.includes(sensor.key)} data-id={sensor.key}>
            <h5 title={sensor.tooltipText} on:click={() => toggleCollapsed(sensor.key)}>
              <span>
                <IoIosArrowForward />
              </span>
              {sensor.name}
            </h5>
            <div>
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
