<script>
  import { sensorList, currentSensor, smallMultipleTimeSpan, currentDate, currentInfoSensor } from '../../stores';
  import FaSearchPlus from 'svelte-icons/fa/FaSearchPlus.svelte';
  import { trackEvent } from '../../stores/ga';
  import throttle from 'lodash-es/throttle';
  import { levelList } from '../../stores/constants';
  import SmallMultiple from './SmallMultiple.svelte';
  import IoMdHelp from 'svelte-icons/io/IoMdHelp.svelte';
  import { prepareSensorData, resolveClickedTimeValue, resolveHighlightedTimeValue } from './vegaSpec';

  /**
   * bi-directional binding
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let detail = null;

  // $: {
  //   if (detail && detail.key !== $currentSensor) {
  //     detail = $currentSensorEntry;
  //   }
  // }

  export let levels = levelList;
  $: levelIds = new Set(levels.map((l) => l.id));
  $: sensors = sensorList.filter((d) => d.levels.some((l) => levelIds.has(l)));

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
   * @type {{info: import('../../maps').NameInfo, color: string}[]}
   */
  export let selections = [];

  $: hasRegion = selections.length > 0;

  $: sensorsWithData = sensors.map((sensor) => prepareSensorData(sensor, selections, startDay, endDay));

  let highlightTimeValue = null;

  const throttled = throttle((value) => {
    highlightTimeValue = value;
  }, 100);

  function onHighlight(e) {
    const value = resolveHighlightedTimeValue(e);
    if (highlightTimeValue !== value) {
      throttled(value);
    }
  }

  function onClick(e) {
    const timeValue = resolveClickedTimeValue(e);
    if (timeValue) {
      trackEvent('side-panel', 'set-date', timeValue);
      currentDate.set(timeValue);
    }
  }
</script>

<style>
  ul {
    list-style-type: none;
    padding: 0 0 0 0.25em;
  }

  .title-button {
    flex: 1 1 0;
    padding: 0;
    cursor: pointer;
    display: block;
    background: none;
    border: none;
    outline: none !important;
    text-align: left;
    color: inherit;
    font-size: 1em;
    line-height: 1.5em;
    margin: 0;
  }

  .title-button:hover,
  .title-button:focus,
  li.selected .title-button {
    color: black;
  }

  :global(#vizbox) .title-button:focus {
    box-shadow: unset !important;
  }

  .header {
    display: flex;
    padding-bottom: 0.1em;
  }

  li {
    margin: 0;
    padding: 0;
  }

  li:hover .toolbar > button,
  li.selected .toolbar > button,
  .toolbar > button:hover,
  .toolbar > button:focus {
    opacity: 1;
  }

  .toolbar {
    font-size: 0.7rem;
    display: flex;
  }
  .toolbar > button {
    opacity: 0;
    transition: opacity 0.25s ease;
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
    <li class:selected={$currentSensor === s.sensor.key} data-testid={s.sensor.key}>
      <div class="header">
        <!-- svelte-ignore a11y-missing-attribute -->
        <button
          class="title-button"
          title={typeof s.sensor.tooltipText === 'function' ? s.sensor.tooltipText() : s.sensor.tooltipText}
          on:click|preventDefault={() => {
            trackEvent('side-panel', 'set-sensor', s.sensor.key);
            currentSensor.set(s.sensor.key);
          }}>
          {typeof s.sensor.mapTitleText === 'function' ? s.sensor.mapTitleText() : s.sensor.name}
        </button>
        <div class="toolbar">
          {#if s.sensor.description}
            <button
              title="Show sensor description"
              class="pg-button info"
              on:click={() => {
                currentInfoSensor.set(s.sensor);
              }}><IoMdHelp /></button>
          {/if}
          <button
            class="pg-button"
            class:hidden={!hasRegion}
            title="Show as detail view"
            class:active={detail === s.sensor}
            on:click|stopPropagation={() => {
              trackEvent('side-panel', detail === s.sensor ? 'hide-detail' : 'show-detail', s.sensor.key);
              detail = detail === s.sensor ? null : s.sensor;
              // Also update currentSensor.
              // $currentSensor = detail ? detail.key : $currentSensor;
            }}>
            <FaSearchPlus />
          </button>
        </div>
      </div>
      <SmallMultiple {s} {highlightTimeValue} {onClick} {onHighlight} />
    </li>
  {/each}
</ul>
