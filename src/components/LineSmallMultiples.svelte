<script>
  import { onMount } from 'svelte';
  import { sensors } from '../stores/index.js';
  import { json } from 'd3-fetch';
  import { currentRegion, currentSensor, currentLevel } from '../stores';
  import { default as embed } from 'vega-embed';
  import { formatAPITime, parseAPITime } from '../data/utils.js';

  // Default width and height for small multiples
  let width = 172;
  const height = 30;

  // Create a date for today in the API's date format
  const finalDay = formatAPITime(new Date());

  let smallMultipleContainer = null;

  // An array of keys that will NOT be shown in small multiples
  const sensorSmallMultipleBlacklist = [
    'ght-smoothed_search',
    'indicator-combination-confirmed_7dav_incidence_num',
    'indicator-combination-deaths_7dav_incidence_num',
    // 'safegraph-full_time_work_prop',
  ];
  let filteredSensors = $sensors.filter((s) => !sensorSmallMultipleBlacklist.includes(s.key));

  function idToSensor(id) {
    return $sensors.find((e) => e.key === id);
  }

  // Carousel approach to small multiples
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

  // Whether we are showing a single metric or everything at once
  let singleView = false;
  function toggleSingleView(focusSignal = null) {
    if (focusSignal.type !== 'click' && !singleView) {
      $currentSensor = focusSignal;
    }
    singleView = !singleView;
  }

  function setSingleView(singleViewBoolean = false) {
    singleView = singleViewBoolean;
  }

  let region = '';

  // Generate a small multiple chart with data from the API
  function generateLineChart(signal = 'part_time_work_prop', source = 'covidcast') {
    const apiURL = `https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast&cached=true&time_type=day&data_source=${source}&signal=${signal}&geo_type=${$currentLevel}&time_values=20200401-${finalDay}&geo_value=${region}`;

    const lineChartSchema = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      height: height,
      // width: width,
      width: smallMultipleContainer ? smallMultipleContainer.offsetWidth * 0.16 : width,
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
            title: null, //'Date',
            format: '%b %e',
            formatType: 'time',
            tickCount: 'month',
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
        d.time_value = parseAPITime(d.time_value);

        return d;
      });
      lineChartSchema.data.values = d.epidata;
      console.log('Making a chart', lineChartSchema);
      embed(`#${source}-${signal}-chart`, lineChartSchema, { actions: false }).catch((error) => console.error(error));
    });
  }

  // Generate a single, larger line chart with slightly different behavior
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
        d.time_value = parseAPITime(d.time_value);
        return d;
      });
      singleLineChartSchema.data.values = d.epidata;
      embed(`#single-sensor-chart`, singleLineChartSchema, { actions: false }).catch((error) => console.error(error));
    });
  }

  // Generate all small multiple charts and the larger single chart
  function generateAllCharts() {
    smallMultipleContainer = document.getElementById('small-multiple-container');
    filteredSensors.forEach((s) => {
      generateLineChart(s.signal, s.id, s);
    });

    generateSingleChart();
  }

  onMount(() => {
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
    max-height: 35vh;
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
    /* margin-top: 1.5em; */
    overflow: hidden;
    min-height: 150px;
    max-height: 22vh;
    overflow-y: auto;
  }
  .small-multiples li {
    text-align: left;
    flex: 1 1 18%;
    vertical-align: top;
    margin: 0;
    padding: 0;
    list-style-type: none;
    text-align: center;
  }
  .small-multiples li h5 {
    font-size: 12px;
    line-height: 1em;
    text-align: left;
    margin: 0;
    padding: 0;
    padding-left: 0.5em;
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
  }

  .small-multiples-topbar h4 {
    font-size: 1.4rem;
  }

  .small-multiples-topbar h4,
  .small-multiples-topbar h5 {
    padding: 0;
    margin: 0.5em 0.25em;
    margin-bottom: 0;
  }

  .small-multiples-topbar h5 {
    /* margin-left: 1em; */
  }

  .small-multiples-tabbar {
    position: absolute;
    height: 32px;
    top: -30px;
    left: 8px;
  }

  .small-multiples-tabbar button {
  }

  #single-sensor-chart,
  #single-chart {
    width: 100%;
  }

  /* eslint-disable-next-line css-unused-selector*/
  [hidden] {
    display: none !important;
  }
  .vega-embed > svg {
    width: 100%;
    height: 100%;
  }

  .active {
    opacity: 1;
    /* background-color: white; */
  }
</style>

<div class="small-multiples container-bg" id="small-multiple-container">
  <div class="small-multiples-tabbar">
    <div id="metric-toggles">
      <button on:click={() => setSingleView(false)} class="button" class:active={!singleView}>All indicators</button>

      <button on:click={() => setSingleView(true)} class="button" class:active={singleView}>
        Single indicator:
        <u>{idToSensor($currentSensor).name}</u>

      </button>
    </div>
  </div>
  <div class="small-multiples-topbar">
    <h4>
      {#if singleView}{idToSensor($currentSensor).name}{:else}{filteredSensors.length} available indicators{/if}
    </h4>

    <h5 hidden={!singleView}>{idToSensor($currentSensor).tooltipText}</h5>

  </div>

  <div id="single-chart" hidden={!singleView}>
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
