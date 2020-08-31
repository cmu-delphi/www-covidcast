<script>
  import { sensorList, currentSensor, currentDateObject, currentRegionInfo, smallMultipleTimeSpan } from '../../stores';
  import FaSearchPlus from 'svelte-icons/fa/FaSearchPlus.svelte';
  import { addMissing, fetchTimeSlice } from '../../data/fetchData';
  import Vega from '../../components/vega/Vega.svelte';
  import spec from './SmallMultiplesChart.json';
  import specStdErr from './SmallMultiplesChartStdErr.json';
  import { merge } from 'lodash-es';
  import { levelMegaCounty } from '../../stores/constants';

  /**
   * bi-directional binding
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let detail = null;

  const sensors = sensorList;

  const specPercent = {
    transform: [
      {},
      // {
      //   calculate: '(datum.value - datum.stderr) / 100',
      // },
      // {
      //   calculate: '(datum.value + datum.stderr) / 100',
      // },
      {
        calculate: 'datum.value == null ? null : datum.value / 100',
        as: 'pValue',
      },
    ],
    encoding: {
      y: {
        field: 'pValue',
        axis: {
          format: '.1%',
        },
      },
    },
  };
  const specPercentStdErr = {
    transform: [
      {},
      {
        calculate: '(datum.value - datum.stderr) / 100',
      },
      {
        calculate: '(datum.value + datum.stderr) / 100',
      },
      {
        calculate: 'datum.value == null ? null : datum.value / 100',
        as: 'pValue',
      },
    ],
    encoding: {
      y: {
        field: 'pValue',
        axis: {
          format: '.1%',
        },
      },
    },
  };

  /**
   * @type {import('../../stores/constants').SensorEntry} sensor
   */
  function chooseSpec(sensor, min, max) {
    const time = {
      encoding: {
        x: {
          scale: {
            domain: [min.getTime(), max.getTime()],
          },
        },
      },
    };

    return merge(
      {},
      sensor.hasStdErr ? specStdErr : spec,
      time,
      sensor.format === 'percent' ? (sensor.hasStdErr ? specPercentStdErr : specPercent) : {},
    );
  }

  // use local variables with manual setting for better value comparison updates
  let startDay = $smallMultipleTimeSpan[0];
  let endDay = $smallMultipleTimeSpan[1];

  $: {
    if (startDay.getTime() !== $smallMultipleTimeSpan[0].getTime()) {
      startDay = $smallMultipleTimeSpan[0];
    }
    if (endDay.getTime() !== $smallMultipleTimeSpan[1].getTime()) {
      endDay = $smallMultipleTimeSpan[1];
    }
  }

  $: hasRegion = Boolean($currentRegionInfo);
  $: isMegaRegion = Boolean($currentRegionInfo) && $currentRegionInfo.level === levelMegaCounty.id;
  $: noDataText = hasRegion ? (isMegaRegion ? `Please select a county` : 'No data available') : 'No location selected';
  $: sensorsWithData = sensors.map((sensor) => ({
    sensor,
    data:
      $currentRegionInfo && !isMegaRegion
        ? fetchTimeSlice(sensor, $currentRegionInfo.level, $currentRegionInfo.propertyId, startDay, endDay, false).then(
            addMissing,
          )
        : [],
    spec: chooseSpec(sensor, startDay, endDay),
  }));
</script>

<style>
  ul {
    list-style-type: none;
    padding: 0 0 0 0.25em;
  }

  h3 {
    font-size: 0.88rem;
    flex: 1 1 0;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
  }
  h3:hover,
  li.selected h3 {
    color: var(--red);
  }

  .header {
    display: flex;
    padding-bottom: 0.1em;
    cursor: pointer;
  }

  li {
    margin: 0;
    padding: 0;
  }

  li:hover .toolbar,
  li.selected .toolbar {
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

  /** mobile **/
  @media only screen and (max-width: 767px) {
    ul {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-auto-flow: row;
    }
    li {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .toolbar {
      display: none;
    }
  }
</style>

<ul class="root">
  {#each sensorsWithData as s}
    <li class:selected={$currentSensor === s.sensor.key}>
      <div class="header">
        <h3
          title={typeof s.sensor.tooltipText === 'function' ? s.sensor.tooltipText() : s.sensor.tooltipText}
          on:click={() => currentSensor.set(s.sensor.key)}>
          {s.sensor.name}
        </h3>
        <div class="toolbar" class:hidden={!hasRegion}>
          <button
            class="pg-button"
            title="Show as detail view"
            class:active={detail === s.sensor}
            on:click|stopPropagation={() => {
              detail = detail === s.sensor ? null : s.sensor;
            }}>
            <FaSearchPlus />
          </button>
        </div>
      </div>
      <div class="single-sensor-chart vega-wrapper">
        <Vega data={s.data} spec={s.spec} {noDataText} signals={{ currentDate: $currentDateObject }} />
      </div>
    </li>
  {/each}
</ul>
