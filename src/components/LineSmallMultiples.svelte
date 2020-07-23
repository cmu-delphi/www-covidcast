<script>
  import { onMount } from 'svelte';
  import { sensors } from '../stores/index.js';
  import { json } from 'd3-fetch';
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
  // import { callAPI, callMetaAPI } from '../data/api';

  import { default as embed } from 'vega-embed';
  // import { compile } from 'vega-lite'

  console.log($sensors);

  console.log({
    currentRegion,
    currentRegionName,
  });
  let regionName = '';
  currentRegionName.subscribe(d => {
    regionName = d;
  });

  function generateLineChart(signal = 'part_time_work_prop', source = 'covidcast') {
    const apiURL = `https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day&data_source=${source}&signal=${signal}&geo_type=county&time_values=20200501-20200710&geo_value=06001`;
    const lineChartSchema = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      description: 'Simple chart',
      height: 50,
      // data: {
      //   values: [
      //     { x: 'A', y: 28 },
      //     { x: 'y', B: 55 },
      //     { x: 'C', y: 43 },
      //     { x: 'D', y: 91 },
      //     { x: 'E', y: 81 },
      //     { x: 'F', y: 53 },
      //     { x: 'G', y: 19 },
      //     { x: 'H', y: 87 },
      //     { x: 'I', y: 52 },
      //   ],
      // },
      data: {
        url: apiURL,
        format: 'json',
      },
      mark: 'line',
      encoding: {
        x: { field: 'time_value', type: 'temporal', timeUnit: 'date' },
        y: { field: 'value', type: 'quantitative' },
      },
    };

    json(apiURL).then(d => {
      // console.log('---->', apiURL, d);

      d.epidata = d.epidata.map(d => {
        let s = '' + d.time_value;
        d.time_value = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} 12:01`);
        return d;
      });
      lineChartSchema.data.values = d.epidata;

      embed(`#${source}-${signal}-chart`, lineChartSchema, { actions: false }).catch(error => console.error(error));
    });
  }

  onMount(() => {
    $sensors.forEach(s => {
      generateLineChart(s.signal, s.id);
    });
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
    height: 129px;
  }
</style>

<div class="small-multiples">
  <!-- {#if regionName}
    <h1>{regionName}</h1>
  {/if} -->

  {#each $sensors as sensor, i}
    <li id="{sensor.id}-{sensor.signal}">
      <h3>{sensor.name}</h3>
      <div id="{sensor.id}-{sensor.signal}-chart" />
    </li>
  {/each}
</div>
