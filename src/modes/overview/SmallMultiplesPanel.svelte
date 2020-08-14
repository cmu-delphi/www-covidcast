<script>
  import SmallMultiples from './SmallMultiples.svelte';
  import { publicSensors, earlySensors, lateSensors, currentSensor } from '../../stores';
  import IoMdExpand from 'svelte-icons/io/IoMdExpand.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  const remove = [
    'ght-smoothed_search',
    'indicator-combination-confirmed_7dav_incidence_num',
    'indicator-combination-deaths_7dav_incidence_num',
    'safegraph-full_time_work_prop',
  ];

  export let detail = null;

  $: sensors = $publicSensors.concat($earlySensors, $lateSensors).filter((d) => !remove.includes(d.key));
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
  {#each sensors as sensor}
    <li>
      <div class="header">
        <h5 title={sensor.tooltipText} on:click={() => currentSensor.set(sensor.key)}>{sensor.name}</h5>
        <div class="toolbar">
          <button
            class="pg-button"
            class:active={detail === sensor}
            on:click|stopPropagation={() => dispatch('show', detail === sensor ? null : sensor)}>
            <IoMdExpand />
          </button>
        </div>
      </div>
      <SmallMultiples {sensor} />
    </li>
  {/each}
</ul>
