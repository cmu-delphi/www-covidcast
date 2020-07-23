<script>
  import { onMount } from 'svelte';
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

  import { default as embed } from 'vega-embed';
  // import { compile } from 'vega-lite'

  console.log({
    currentRegion,
    currentRegionName,
  });
  let regionName = '';
  currentRegionName.subscribe(d => {
    regionName = d;
  });

  const lineChartSchema = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    description: 'Simple bar chart',
    data: {
      values: [
        { x: 'A', y: 28 },
        { x: 'y', B: 55 },
        { x: 'C', y: 43 },
        { x: 'D', y: 91 },
        { x: 'E', y: 81 },
        { x: 'F', y: 53 },
        { x: 'G', y: 19 },
        { x: 'H', y: 87 },
        { x: 'I', y: 52 },
      ],
    },
    mark: 'bar',
    encoding: {
      x: { field: 'x', type: 'ordinal' },
      y: { field: 'y', type: 'quantitative' },
    },
  };

  onMount(() => {
    embed('#linechart', lineChartSchema, { actions: false }).catch(error => console.error(error));
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
    width: 129px;
    height: 129px;
  }
</style>

<div class="small-multiples">
  {#if regionName}
    <h1>{regionName}</h1>
  {/if}

  {#each $sensors.slice(0, 3) as sensor, i}
    <li id="linechart">{sensor.name}</li>
  {/each}
</div>
