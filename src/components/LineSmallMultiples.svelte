<script>
  import { onMount } from 'svelte';
  import { sensors } from '../stores/index.js';
  import { json } from 'd3-fetch';
  import { timeFormat } from 'd3';
  // import { readable } from 'svelte/store';
  import {
    currentRegion,
    // currentRegionName,
    currentSensor,
    currentLevel,
    // currentDate,
    // currentData,
    // currentRange,
  } from '../stores';
  // import { callAPI, callMetaAPI } from '../data/api';
  import moment from 'moment';

  let width = 172;
  const height = 30;

  const finalDay = timeFormat('%Y%m%d')(new Date());

  import { default as embed } from 'vega-embed';
  // import { compile } from 'vega-lite'

  //let smallMultipleStart = 0;
  let smallMultipleContainer = null;
  const sensorSmallMultipleBlacklist = [
    'ght-smoothed_search',
    'indicator-combination-confirmed_7dav_incidence_num',
    'indicator-combination-deaths_7dav_incidence_num',
    'safegraph-full_time_work_prop',
  ];
  let filteredSensors = $sensors.filter((s) => !sensorSmallMultipleBlacklist.includes(s.key));
  console.log($sensors);
  // TODO: Fix in Safari
  // TODO: Don't show metrics that have no data
  // TODO: Color signal title by current region's color scale in that metric

  // DONE: Filter out sensors we don't want
  // DONE: Make end date of range programmatic
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
      // console.log('Setting signal to ', focusSignal);
      $currentSensor = focusSignal;
    }
    singleView = !singleView;
  }

  function setSingleView(singleViewBoolean = false) {
    singleView = singleViewBoolean;
  }
  // console.log($sensors);

  // console.log({
  //   currentRegion,
  //   currentRegionName,
  // });
  let region = '';

  function generateLineChart(signal = 'part_time_work_prop', source = 'covidcast') {
    const apiURL = `https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day&data_source=${source}&signal=${signal}&geo_type=${$currentLevel}&time_values=20200401-${finalDay}&geo_value=${region}`;

    const lineChartSchema = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      height: height,
      // width: width,
      width: smallMultipleContainer ? smallMultipleContainer.offsetWidth * 0.21 : width,
      padding: 0,
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
          // axis: null,
          axis: {
            title: null,
          },
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
              encodings: ['x', 'y'],
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
            y: { value: height - 5 },
            text: { field: 'time_value', type: 'temporal', format: '%m %d' },
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
          mark: 'text',
          encoding: {
            y: { value: height - 15 },
            text: { field: 'value', type: 'quantitative', format: '.1r' },
            color: {
              value: 'black',
            },
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
        d.time_value = moment(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} 12:01`); //.toString();

        return d;
      });
      lineChartSchema.data.values = d.epidata;
      console.log('Making a chart', lineChartSchema);
      embed(`#${source}-${signal}-chart`, lineChartSchema, { actions: false }).catch((error) => console.error(error));
    });
  }

  function generateSingleChart() {
    // console.log({ $currentSensor });
    const s = idToSensor($currentSensor);
    smallMultipleContainer = document.getElementById('small-multiple-container');

    if (smallMultipleContainer) console.log('WIDTH!', smallMultipleContainer.offsetWidth);
    // console.log('s!!!!', s);
    const apiURL = `https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day&data_source=${s.id}&signal=${s.signal}&geo_type=${$currentLevel}&time_values=20200401-${finalDay}&geo_value=${region}`;

    const singleLineChartSchema = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      height: 105,
      width: smallMultipleContainer ? smallMultipleContainer.offsetWidth * 0.92 : 624,
      // render: 'svg',
      // autosize: {
      //   type: 'fit',
      //   contains: 'padding',
      // },
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
            tickCount: 'month',
          },
        },
        y: {
          field: 'value',
          type: 'quantitative',
          axis: {
            // title: s ? (s.yAxis.length < 15 ? s.yAxis : ' ') : ' ',
            // title: null,
            title: s.yAxis ? s.yAxis : ' ',
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
            y: { value: 20 },
            text: { field: 'value', type: 'quantitative', format: '.1r' },
            color: {
              value: 'black',
            },
          },
        },
      ],
    };

    json(apiURL).then((d) => {
      if (!d.epidata) return;
      d.epidata = d.epidata.map((d) => {
        let s = '' + d.time_value;
        d.time_value = moment(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} 12:01`); //.toString();
        return d;
      });
      singleLineChartSchema.data.values = d.epidata;
      embed(`#single-sensor-chart`, singleLineChartSchema, { actions: false }).catch((error) => console.error(error));
    });
  }

  function generateAllCharts() {
    console.log('width', width);
    smallMultipleContainer = document.getElementById('small-multiple-container');
    filteredSensors.forEach((s) => {
      generateLineChart(s.signal, s.id, s);
    });

    generateSingleChart();
  }

  onMount(() => {
    console.log(smallMultipleContainer);
    console.log('width', width);

    currentRegion.subscribe((d) => {
      region = d;
      generateAllCharts();
    });

    currentSensor.subscribe(() => {
      generateSingleChart();
    });
  });
</script>

<style>
  .small-multiples {
    z-index: 100;
    position: absolute;
    right: 1em;
    bottom: 12px;
    padding: 0.25em;
    width: 68vw;
    /* min-height: 224px;
    max-height: 36vh; */
    max-height: 35vh;
    /* overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap; */
    /* overflow-y: auto; */
    background-color: white;
  }
  #single-chart {
    margin-top: 0.5em;
    overflow-y: hidden;
    overflow-x: auto;
  }

  #multiples-charts {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: flex-start;
    flex-direction: row;
    align-content: flex-start;
    margin-top: 1.5em;
    /* overflow-y: auto;
    overflow-x: hidden; */
    overflow: hidden;
    min-height: 150px;
    max-height: 20vh;
    overflow-y: auto;
  }
  .small-multiples li {
    text-align: left;
    /* display: inline-block; */
    flex: 1 1 22%;
    vertical-align: top;
    margin: 0;
    /* margin-right: 4px; */
    /* margin-bottom: 4px; */
    padding: 0;
    /* padding-top: 0.27em; */
    /* 'height': 100px;
    width: 150px; */
    list-style-type: none;
    text-align: center;
  }
  .small-multiples li h5 {
    /*font-size: 9px;*/
    /* height: 2.5em; */
    text-align: left;
    margin: 0;
    padding: 0;
    padding-left: 1.45em;
    color: #999;
    cursor: pointer;
  }
  .small-multiples li h5:hover {
    text-decoration: underline;
  }
  .sensor-chart {
    margin: 0;
  }

  #metric-toggle {
    position: absolute;
    right: 0.4em;
    top: 0.4em;
    width: 12%;
  }

  .button {
    min-width: 110px;
    border-radius: 4px 4px 0 0;
    margin: 0;
    border: 1px solid #dbdbdb;
    padding: 0.5em;
  }

  button.active {
    font-weight: bold !important;
  }

  .small-multiples-topbar {
    /* border: 1px solid black; */
  }

  .small-multiples-topbar h4 {
    font-size: 1.4rem;
  }

  .small-multiples-topbar h4,
  .small-multiples-topbar h5 {
    margin: 1em 0.5em;
    margin-bottom: 0;
  }

  .small-multiples-topbar h5 {
    margin-left: 1em;
  }

  .small-multiples-tabbar {
    position: absolute;
    height: 32px;
    top: -30px;
    left: 8px;
  }

  #single-sensor-chart,
  #single-chart {
    width: 100%;
  }

  [hidden] {
    display: none !important;
  }
  .vega-embed > svg {
    width: 100%;
    height: 100%;
  }

  .active {
    background-color: white;
  }
</style>

<div class="small-multiples container-bg" id="small-multiple-container">
  <div class="small-multiples-tabbar">
    <!-- <button on:click={toggleSingleView} id="metric-toggle" class="button">
      {#if singleView}All indicators{:else}{/if}
    </button> -->
    <div id="metric-toggles">
      <button on:click={() => setSingleView(false)} class="button" class:active={!singleView}>All indicators</button>

      <button on:click={() => setSingleView(true)} class="button" class:active={singleView}>
        Single indicator:
        <u>{idToSensor($currentSensor).name}</u>

      </button>
    </div>
  </div>
  <div class="small-multiples-topbar">
    <!-- {#if regionName}
    <h1>{regionName}</h1>
  {/if} -->

    <h4>
      {#if singleView}{idToSensor($currentSensor).name}{:else}{filteredSensors.length} available indicators{/if}

      <!-- <span hidden={singleView}>
      <button on:click={smallMultiplePrev}>Previous</button>
      <button on:click={smallMultipleNext}>Next</button>
    </span> -->
    </h4>

    <h5 hidden={!singleView}>{idToSensor($currentSensor).tooltipText}</h5>

  </div>

  <div id="single-chart" hidden={!singleView}>
    <!-- <div id="single-{sensor.id}-{sensor.signal}-chart" class="single-sensor-chart" /> -->
    <div id="single-sensor-chart" />
  </div>

  <div id="multiples-charts" hidden={singleView}>
    {#each filteredSensors as sensor, i}
      <li id="{sensor.id}-{sensor.signal}">
        <h5 title={sensor.tooltipText} on:click={() => toggleSingleView(sensor.key)}>{sensor.name}</h5>
        <div id="{sensor.id}-{sensor.signal}-chart" class="sensor-chart" />
      </li>
    {/each}
  </div>
</div>
