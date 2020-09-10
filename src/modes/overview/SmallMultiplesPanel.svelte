<script>
  import { sensorList, currentSensor, currentDateObject, smallMultipleTimeSpan, currentDate } from '../../stores';
  import FaSearchPlus from 'svelte-icons/fa/FaSearchPlus.svelte';
  import { addMissing, fetchTimeSlice } from '../../data/fetchData';
  import Vega from '../../components/Vega.svelte';
  import spec from './SmallMultiplesChart.json';
  import specStdErr from './SmallMultiplesChartStdErr.json';
  import { trackEvent } from '../../stores/ga';
  import { merge, throttle } from 'lodash-es';
  import { levelList, levelMegaCounty } from '../../stores/constants';

  /**
   * bi-directional binding
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let detail = null;

  export let levels = levelList;
  $: levelIds = new Set(levels.map((l) => l.id));
  $: sensors = sensorList.filter((d) => d.levels.some((l) => levelIds.has(l)));

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

  /**
   * @type {import('../../maps').NameInfo | null}
   */
  export let region = null;

  $: hasRegion = Boolean(region);
  $: isMegaRegion = Boolean(region) && region.level === levelMegaCounty.id;
  $: noDataText = hasRegion ? (isMegaRegion ? `Please select a county` : 'No data available') : 'No location selected';
  $: sensorsWithData = sensors.map((sensor) => ({
    sensor,
    data:
      region && !isMegaRegion
        ? fetchTimeSlice(sensor, region.level, region.propertyId, startDay, endDay, false).then(addMissing)
        : [],
    spec: chooseSpec(sensor, startDay, endDay),
  }));

  let highlightTimeValue = null;

  const throttled = throttle((value) => {
    highlightTimeValue = value;
  }, 10);

  function onHighlight(e) {
    const highlighted = e.detail.value;
    const id = highlighted && Array.isArray(highlighted._vgsid_) ? highlighted._vgsid_[0] : null;

    if (!id) {
      throttled(null);
      return;
    }
    const row = e.detail.view.data('data_0').find((d) => d._vgsid_ === id);
    throttled(row ? row.time_value : null);
  }
  function onClick(e) {
    const item = e.detail.item;
    if (item && item.isVoronoi) {
      currentDate.set(item.datum.datum.time_value);
    }
  }
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
    right: 2px;
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
          on:click={() => {
            trackEvent('side-panel', 'set-sensor', s.sensor.key);
            currentSensor.set(s.sensor.key);
          }}>
          {s.sensor.name}
        </h3>
        <div class="toolbar" class:hidden={!hasRegion}>
          <button
            class="pg-button"
            title="Show as detail view"
            class:active={detail === s.sensor}
            on:click|stopPropagation={() => {
              trackEvent('side-panel', detail === s.sensor ? 'hide-detail' : 'show-detail', s.sensor.key);
              detail = detail === s.sensor ? null : s.sensor;
            }}>
            <FaSearchPlus />
          </button>
        </div>
      </div>
      <div class="single-sensor-chart vega-wrapper">
        <Vega
          data={s.data}
          spec={s.spec}
          {noDataText}
          signals={{ currentDate: $currentDateObject, highlightTimeValue }}
          signalListeners={['highlight']}
          eventListeners={['click']}
          on:click={onClick}
          on:signal={onHighlight} />
      </div>
    </li>
  {/each}
</ul>
