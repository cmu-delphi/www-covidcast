<script>
  import SmallMultiples from './SmallMultiples.svelte';
  import { sensorList, currentSensor, currentLevel, currentRegion } from '../../stores';
  import IoMdExpand from 'svelte-icons/io/IoMdExpand.svelte';
  import { createEventDispatcher } from 'svelte';
  import { parseAPITime } from '../../data';
  import { fetchMultipleTimeSlices } from '../../data/fetchData';

  const dispatch = createEventDispatcher();

  const remove = ['ght-smoothed_search', 'safegraph-full_time_work_prop'];

  export let detail = null;

  // Create a date for today in the API's date format
  const startDay = parseAPITime('20200401');
  const finalDay = new Date();

  const sensors = sensorList.filter((d) => !remove.includes(d.key));

  $: sensorsWithData = fetchMultipleTimeSlices(sensors, $currentLevel, $currentRegion, startDay, finalDay).map(
    (data, i) => ({
      sensor: sensors[i],
      data,
    }),
  );
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
</style>

<ul class="root">
  {#each sensorsWithData as s}
    <li>
      <div class="header">
        <h5 title={s.sensor.tooltipText} on:click={() => currentSensor.set(s.sensor.key)}>{s.sensor.name}</h5>
        <div class="toolbar">
          <button
            class="pg-button"
            class:active={detail === s.sensor}
            on:click|stopPropagation={() => dispatch('show', detail === s.sensor ? null : s.sensor)}>
            <IoMdExpand />
          </button>
        </div>
      </div>
      <SmallMultiples data={s.data} />
    </li>
  {/each}
</ul>
