<script>
  import { onMount } from 'svelte';
  import { sensors } from '../stores/index.js';
  import { json } from 'd3-fetch';
  // import { readable } from 'svelte/store';
  import {
    currentRegion,
    currentRegionName,
    currentSensor,
    currentLevel,
    // currentDate,
    // currentData,
    // currentRange,
  } from '../stores';
  // import { callAPI, callMetaAPI } from '../data/api';

  const width = 100;
  const height = 30;

  import { default as embed } from 'vega-embed';
  // import { compile } from 'vega-lite'

  //let smallMultipleStart = 0;
  let smallMultipleContainer = null;

  // TODO: Fix in Safari
  // TODO: Don't show metrics that have no data
  // TODO: Make end date of range programmatic
  // TODO: Make the active signal first in the list of small multiples
  // TODO: On active sensor change, scroll so it is first in small

  // TODO: Color signal title by current region's color scale in that metric

  // DONE: Make it work for metro areas and states
  // DONE: Add single metric view
  // DONE: Determine the widths and distances between elements and advance by that amount
  // DONE: Don't let the user go under 0 or above the total number of signals shown

  function idToSensor(id) {
    return $sensors.find((e) => e.key === id);
  }
  /*
  function smallMultipleNext() {
    handleSmallMultipleNav('next');
    // smallMultipleContainer.scrollLeft += width * 1.35;
  }
  function smallMultiplePrev() {
    handleSmallMultipleNav('prev');
    // smallMultipleContainer.scrollLeft -= width * 1.35;
  }
  function handleSmallMultipleNav(direction = 'next') {
    const steps = document.querySelectorAll('.small-multiples li');
    const stepNum = steps.length;
    // console.log({ step, steps }, step.offsetLeft);
    if (direction === 'next') {
      if (smallMultipleStart === stepNum) smallMultipleStart = 0;
      else smallMultipleStart += 1;
      const step = steps[smallMultipleStart];

      smallMultipleContainer.scrollTo({
        left: step.offsetLeft,
        behavior: 'smooth',
      });
    } else if (direction === 'prev') {
      if (smallMultipleStart === 0) smallMultipleStart = 0;
      else smallMultipleStart -= 1;
      const step = steps[smallMultipleStart];

      smallMultipleContainer.scrollTo({
        left: step.offsetLeft,
        behavior: 'smooth',
      });
    } else return false;
  }
  */

  let singleView = false;
  function toggleSingleView(focusSignal = null) {
    if (focusSignal.type !== 'click' && !singleView) {
      console.log('Setting signal to ', focusSignal);
      $currentSensor = focusSignal;
    }
    singleView = !singleView;
  }

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

  currentSensor.subscribe(() => {
    generateSingleChart();
  });

  function generateLineChart(signal = 'part_time_work_prop', source = 'covidcast') {
    const apiURL = `https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day&data_source=${source}&signal=${signal}&geo_type=${$currentLevel}&time_values=20200401-20200720&geo_value=${region}`;
    const lineChartSchema = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      height: height,
      width: width,
      data: {
        values: null, // to be filled by API
      },
      // mark: 'line',
      encoding: {
        color: {
          value: 'grey',
        },
        x: {
          field: 'time_value',
          type: 'temporal',
          axis: null,
        },
        y: {
          field: 'value',
          type: 'quantitative',
          axis: null,
        },
      },
      layer: [
        {
          mark: {
            type: 'line',
            interpolate: 'monotone',
          },
        },
        {
          selection: {
            index: {
              type: 'single',
              on: 'mousemove',
              encodings: ['x'],
              nearest: true,
            },
          },
          mark: { type: 'point' },
          encoding: {
            y: { field: 'value', type: 'quantitative' },
            opacity: { value: 0 },
          },
        },
        {
          transform: [
            {
              filter: {
                and: ['index.time_value', { selection: 'index' }],
              },
            },
          ],
          mark: 'rule',
        },
        {
          transform: [
            {
              filter: {
                and: ['index.time_value', { selection: 'index' }],
              },
            },
          ],
          mark: 'text',
          encoding: {
            y: { value: 10 },
            text: { field: 'time_value', type: 'temporal' },
          },
        },
      ],
    };

    json(apiURL).then((d) => {
      if (!d.epidata) {
        console.log('Error retrieving data for ', source, signal, region, apiURL);
        return;
      }
      d.epidata = d.epidata.map((d) => {
        let s = '' + d.time_value;
        d.time_value = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} 12:01`).toString();
        return d;
      });
      lineChartSchema.data.values = d.epidata;
      embed(`#${source}-${signal}-chart`, lineChartSchema, { actions: false }).catch((error) => console.error(error));
    });
  }

  function generateSingleChart() {
    console.log({ $currentSensor });
    const s = idToSensor($currentSensor);
    console.log('s!!!!', s);
    const apiURL = `https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day&data_source=${s.id}&signal=${s.signal}&geo_type=${$currentLevel}&time_values=20200401-20200710&geo_value=${region}`;
    // const apiURL = `https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day&data_source=doctor-visits&signal=smoothed_adj_cli&geo_type=county&time_values=20200401-20200710&geo_value=45051`;
    const singleLineChartSchema = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      height: 75,
      width: 600,
      data: {
        values: null, // to be filled by API
      },
      // mark: 'line',
      encoding: {
        color: {
          value: 'grey',
        },
        x: {
          field: 'time_value',
          type: 'temporal',
          axis: {
            title: null, //'Date',
            format: '%b %e',
            formatType: 'time',
            // tickCount: 4,
          },
        },
        y: {
          field: 'value',
          type: 'quantitative',
          axis: {
            // title: sensor ? (sensor.yAxis.length < 15 ? sensor.yAxis : ' ') : ' ',
            title: null,
          },
        },
      },
      layer: [
        {
          mark: {
            type: 'line',
            interpolate: 'monotone',
          },
        },
        {
          selection: {
            index: {
              type: 'single',
              on: 'mousemove',
              encodings: ['x'],
              nearest: true,
            },
          },
          mark: { type: 'point' },
          encoding: {
            y: { field: 'value', type: 'quantitative' },
            opacity: { value: 0 },
          },
        },
        {
          transform: [
            {
              filter: {
                and: ['index.time_value', { selection: 'index' }],
              },
            },
          ],
          mark: 'rule',
        },
        {
          transform: [
            {
              filter: {
                and: ['index.time_value', { selection: 'index' }],
              },
            },
          ],
          mark: 'text',
          encoding: {
            y: { value: 10 },
            text: { field: 'time_value', type: 'temporal' },
          },
        },
      ],
    };

    json(apiURL).then((d) => {
      d.epidata = d.epidata.map((d) => {
        let s = '' + d.time_value;
        d.time_value = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} 12:01`).toString();
        return d;
      });
      singleLineChartSchema.data.values = d.epidata;
      embed(`#single-sensor-chart`, singleLineChartSchema, { actions: false }).catch((error) => console.error(error));
    });
  }

  function generateAllCharts() {
    $sensors.forEach((s) => {
      generateLineChart(s.signal, s.id, s);
    });

    generateSingleChart();
  }

  onMount(() => {
    smallMultipleContainer = document.getElementById('small-multiple-container');

    // generateAllCharts();
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
    width: 65vw;
    height: 28vh;
    min-height: 140px;
    /* overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap; */

    background-color: white;
  }

  .small-multiples li {
    text-align: left;
    display: inline-block;
    vertical-align: top;
    margin: 0;
    margin-right: 4px;
    margin-bottom: 4px;
    width: 130px;
    padding: 2px;
    /* height: 100px;
    width: 150px; */
  }
  .small-multiples li h5 {
    font-size: 10px;
    /* height: 2.5em; */
    margin: 0;
    padding: 0;
    color: #999;
    cursor: pointer;
  }
  .sensor-chart {
    margin: 0;
  }
  .small-multiples h4 {
    position: sticky;
    left: 0.25em;
    margin: 0;
    margin-bottom: 0.25em;
  }
</style>

<div class="small-multiples container-bg" id="small-multiple-container">
  <!-- {#if regionName}
    <h1>{regionName}</h1>
  {/if} -->

  <h4>
    {#if singleView}{$currentSensor}{:else}{$sensors.length} available signals{/if}

    <!-- <span hidden={singleView}>
      <button on:click={smallMultiplePrev}>Previous</button>
      <button on:click={smallMultipleNext}>Next</button>
    </span> -->
    <button on:click={toggleSingleView}>
      {#if singleView}All metrics{:else}Single metric{/if}
    </button>
  </h4>

  <!-- {#if !singleView} -->
  <div id="multiples-charts" hidden={singleView}>
    {#each $sensors as sensor, i}
      <li id="{sensor.id}-{sensor.signal}">
        <h5 title={sensor.tooltipText} on:click={() => toggleSingleView(sensor.key)}>{sensor.name}</h5>
        <div id="{sensor.id}-{sensor.signal}-chart" class="sensor-chart" />
      </li>
    {/each}
  </div>
  <!-- {/if} -->

  <!-- {#if singleView} -->
  <div id="single-chart" hidden={!singleView}>
    <!-- <div id="single-{sensor.id}-{sensor.signal}-chart" class="single-sensor-chart" /> -->
    <div id="single-sensor-chart" class="single-sensor-chart" />

  </div>
  <!-- {/if} -->
</div>
