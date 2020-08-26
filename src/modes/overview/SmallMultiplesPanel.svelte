<script>
  import { sensorList, currentSensor, currentDateObject, currentRegionInfo, yesterdayDate } from '../../stores';
  import FaSearchPlus from 'svelte-icons/fa/FaSearchPlus.svelte';
  import { parseAPITime } from '../../data';
  import { fetchTimeSlice } from '../../data/fetchData';
  import Vega from '../../components/vega/Vega.svelte';
  import specBase from './SmallMultiplesChart.json';
  import { merge } from 'lodash-es';

  const remove = ['ght-smoothed_search', 'safegraph-full_time_work_prop'];

  /**
   * bi-directional binding
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let detail = null;

  // Create a date for today in the API's date format
  const startDay = parseAPITime('20200401');
  const finalDay = yesterdayDate;

  const sensors = sensorList.filter((d) => !remove.includes(d.key));

  const spec = merge({}, specBase, {
    encoding: {
      x: {
        scale: {
          domain: [startDay.getTime(), finalDay.getTime()],
        },
      },
    },
  });

  const specPercent = merge({}, spec, {
    transform: [
      {},
      {
        calculate: 'datum.value / 100',
        as: 'pValue',
      },
    ],
    encoding: {
      y: {
        field: 'pValue',
        axis: {
          format: '.1%',
        },
      },
    },
  });

  $: hasRegion = Boolean($currentRegionInfo);
  $: sensorsWithData = sensors.map((sensor) => ({
    sensor,
    data: $currentRegionInfo
      ? fetchTimeSlice(sensor, $currentRegionInfo.level, $currentRegionInfo.propertyId, startDay, finalDay, false)
      : [],
    spec: sensor.format === 'percent' ? specPercent : spec,
  }));
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
            <FaSearchPlus />
          </button>
        </div>
      </div>
      <div class="single-sensor-chart vega-wrapper">
        <Vega
          data={s.data}
          spec={s.spec}
          noDataText={hasRegion ? 'No data available' : 'No location selected'}
          signals={{ currentDate: $currentDateObject }} />
      </div>
    </li>
  {/each}
</ul>
