<script>
  import {
    sensorList,
    currentSensor,
    currentDateObject,
    currentRegionInfo,
    yesterdayDate,
    levelList,
  } from '../../stores';
  import IoMdExpand from 'svelte-icons/io/IoMdExpand.svelte';
  import { parseAPITime } from '../../data';
  import { fetchMultipleTimeSlices } from '../../data/fetchData';
  import Vega from '../../components/vega/Vega.svelte';
  import spec from './SmallMultiplesChart.json';

  const remove = ['ght-smoothed_search', 'safegraph-full_time_work_prop'];

  /**
   * bi-directional binding
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let detail = null;

  // Create a date for today in the API's date format
  const startDay = parseAPITime('20200401');
  const finalDay = yesterdayDate;

  export let levels = levelList;
  $: levelIds = new Set(levels.map((l) => l.id));
  $: sensors = sensorList.filter((d) => d.levels.some((l) => levelIds.has(l)) && !remove.includes(d.key));

  $: hasRegion = Boolean($currentRegionInfo);
  $: sensorsWithData = $currentRegionInfo
    ? fetchMultipleTimeSlices(
        sensors,
        $currentRegionInfo.level,
        $currentRegionInfo.propertyId,
        startDay,
        finalDay,
        true,
      ).map((data, i) => ({
        sensor: sensors[i],
        data,
      }))
    : sensors.map((sensor) => ({ sensor, data: [] }));
</script>

<style>
  ul {
    list-style-type: none;
    padding: 0 0 0 0.25em;
  }

  h3 {
    font-size: 0.88rem;
    flex: 1 1 0;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
  }

  h3:hover,
  li.selected h3 {
    color: var(--red);
  }

  .header {
    display: flex;
    align-items: center;
    padding-bottom: 0.1em;
    cursor: pointer;
  }

  li {
    margin: 0;
    padding: 0;
  }

  li:hover .toolbar,
  li.selected .toolbar {
    opacity: 1;
  }

  .toolbar {
    display: flex;
    font-size: 0.7rem;
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .single-sensor-chart {
    height: 4em;
  }

  .vega-wrapper {
    position: relative;
  }
  .vega-wrapper > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }

  .hidden {
    display: none;
  }

  /** mobile **/
  @media only screen and (max-width: 767px) {
    ul {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-auto-flow: row;
    }
    li {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .toolbar {
      display: none;
    }
  }
</style>

<ul class="root">
  {#each sensorsWithData as s}
    <li class:selected={$currentSensor === s.sensor.key}>
      <div class="header">
        <h3
          title={typeof s.sensor.tooltipText === 'function' ? s.sensor.tooltipText() : s.sensor.tooltipText}
          on:click={() => currentSensor.set(s.sensor.key)}>
          {s.sensor.name}
        </h3>
        <div class="toolbar" class:hidden={!hasRegion}>
          <button
            class="pg-button"
            title="Show as detail view"
            class:active={detail === s.sensor}
            on:click|stopPropagation={() => {
              detail = detail === s.sensor ? null : s.sensor;
            }}>
            <IoMdExpand />
          </button>
        </div>
      </div>
      <div class="single-sensor-chart vega-wrapper">
        <Vega
          data={s.data}
          {spec}
          noDataText={hasRegion ? 'No data available' : 'No location selected'}
          signals={{ currentDate: $currentDateObject }} />
      </div>
    </li>
  {/each}
</ul>
