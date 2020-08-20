<script>
  import { sensorList, currentSensor, currentLevel, currentRegion } from '../../stores';
  import IoMdExpand from 'svelte-icons/io/IoMdExpand.svelte';
  import { createEventDispatcher } from 'svelte';
  import { parseAPITime } from '../../data';
  import { fetchMultipleTimeSlices } from '../../data/fetchData';
  import Vega from '../../components/vega/Vega.svelte';
  import spec from './SmallMultiplesChart.json';

  const dispatch = createEventDispatcher();

  const remove = ['ght-smoothed_search', 'safegraph-full_time_work_prop'];

  export let detail = null;

  // Create a date for today in the API's date format
  const startDay = parseAPITime('20200401');
  const finalDay = new Date();

  const sensors = sensorList.filter((d) => !remove.includes(d.key));

  $: hasRegion = Boolean($currentRegion);
  $: sensorsWithData = hasRegion
    ? fetchMultipleTimeSlices(sensors, $currentLevel, $currentRegion, startDay, finalDay).map((data, i) => ({
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

  h5 {
    font-size: 0.88rem;
    flex: 1 1 0;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
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

  li:hover .toolbar {
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
</style>

<ul class="root">
  {#each sensorsWithData as s}
    <li>
      <div class="header">
        <h5 title={s.sensor.tooltipText} on:click={() => currentSensor.set(s.sensor.key)}>{s.sensor.name}</h5>
        <div class="toolbar" class:hidden={!hasRegion}>
          <button
            class="pg-button"
            class:active={detail === s.sensor}
            on:click|stopPropagation={() => dispatch('show', detail === s.sensor ? null : s.sensor)}>
            <IoMdExpand />
          </button>
        </div>
      </div>
      <div class="single-sensor-chart vega-wrapper">
        <Vega data={s.data} {spec} noDataText={hasRegion ? null : 'No location selected'} />
      </div>
    </li>
  {/each}
</ul>
