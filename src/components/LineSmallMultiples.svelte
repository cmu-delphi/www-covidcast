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
  let region = '';
  currentRegion.subscribe((d) => {
    region = d;
    generateAllCharts();
  });

  function generateLineChart(signal = 'part_time_work_prop', source = 'covidcast', sensor) {
    const apiURL = `https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day&data_source=${source}&signal=${signal}&geo_type=county&time_values=20200401-20200710&geo_value=${region}`;
    const lineChartSchema = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      height: 36,
      width: 120,
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
        values: null, // to be filled by API
      },
      // mark: 'line',
      mark: {
        type: 'line',
        interpolate: 'monotone',
      },
      encoding: {
        color: {
          value: 'grey',
        },
        x: {
          field: 'time_value',
          type: 'temporal',
          axis: {
            title: 'Date',
            format: '%b',
            formatType: 'time',
            tickCount: 4,
          },
        },
        y: {
          field: 'value',
          type: 'quantitative',
          axis: {
            title: sensor ? (sensor.yAxis.length < 15 ? sensor.yAxis : ' ') : ' ',
          },
        },
      },
    };

    json(apiURL).then((d) => {
      // console.log('---->', apiURL, d);

      d.epidata = d.epidata.map((d) => {
        let s = '' + d.time_value;
        d.time_value = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} 12:01`).toString();
        return d;
      });
      lineChartSchema.data.values = d.epidata;
      console.log(lineChartSchema);
      embed(`#${source}-${signal}-chart`, lineChartSchema, { actions: false }).catch((error) => console.error(error));
    });
  }

  function generateAllCharts() {
    $sensors.forEach((s) => {
      generateLineChart(s.signal, s.id, s);
    });
  }

  onMount(() => {
    generateAllCharts();
  });
</script>

<style>
  .small-multiples {
    text-align: center;
    z-index: 100;
    position: absolute;
    right: 0.5em;
    bottom: 24px;
    padding: 0.25em;
    width: 55vw;
    height: 22vh;
    overflow-y: auto;

    background-color: white;
  }

  .small-multiples li {
    text-align: left;
    display: inline-block;
    vertical-align: top;
    margin: 0;
    margin-right: 0.25em;
    margin-bottom: 0.25em;
    padding: 8px;
    height: 100px;
    width: 150px;
  }
  .small-multiples li h5 {
    height: 2.5em;
    margin: 0;
    padding: 0;
  }
  h3 {
    margin: 0.25em;
  }
</style>

<div class="small-multiples">
  <!-- {#if regionName}
    <h1>{regionName}</h1>
  {/if} -->
  <h3>{$sensors.length} available signals</h3>
  {#each $sensors as sensor, i}
    <li id="{sensor.id}-{sensor.signal}">
      <h5 title={sensor.tooltipText}>{sensor.name}</h5>
      <div id="{sensor.id}-{sensor.signal}-chart" />
    </li>
  {/each}
</div>
