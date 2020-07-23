<script>
  import { sensors } from '../stores/index.js';
  // import { readable } from 'svelte/store';
  import {
    currentRegion,
    currentRegionName,
    // currentSensor,
    // currentLevel,
    // currentDate,
    // currentData,
    // currentRange,
  } from '../stores';

  console.log({
    currentRegion,
    currentRegionName,
  });
  let regionName = '';
  currentRegionName.subscribe(d => {
    regionName = d;
  });
</script>

<style>
  .small-multiples {
    z-index: 100;
    position: absolute;
    right: 140px;
    bottom: 24px;
    padding: 1em;
    width: 50vw;
    height: 30vh;
    overflow-y: auto;

    background-color: white;
  }

  .small-multiples li {
    display: inline-block;
    margin-right: 2em;
    padding: 8px;
  }
</style>

<div class="small-multiples">
  {#if regionName}
    <h1>{regionName}</h1>
  {/if}

  {#each $sensors.slice(0, 3) as sensor, i}
    <li>{sensor.name}</li>
  {/each}
</div>
