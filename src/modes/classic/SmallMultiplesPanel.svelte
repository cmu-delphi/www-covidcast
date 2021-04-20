<script>
  import { sensorList, currentSensor, smallMultipleTimeSpan, currentDate, highlightTimeValue } from '../../stores';
  import { trackEvent } from '../../stores/ga';
  import { levelList } from '../../stores/constants';
  import SmallMultiple from './SmallMultiple.svelte';
  import { prepareSensorData, resolveClickedTimeValue, onHighlight } from './vegaSpec';
  import InfoDialogButton from './components/InfoDialogButton.svelte';

  /**
   * bi-directional binding
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let detail = null;

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

  function onClick(e) {
    const timeValue = resolveClickedTimeValue(e);
    if (timeValue) {
      trackEvent('side-panel', 'set-date', timeValue);
      currentDate.set(timeValue);
    }
  }
</script>

<ul class="root">
  {#each sensorsWithData as s}
    <li class:selected={$currentSensor === s.sensor.key} data-testid={s.sensor.key}>
      <div class="header">
        <!-- svelte-ignore a11y-missing-attribute -->
        <button
          class="uk-button uk-button-text"
          title={typeof s.sensor.tooltipText === 'function' ? s.sensor.tooltipText() : s.sensor.tooltipText}
          on:click|preventDefault={() => {
            trackEvent('side-panel', 'set-sensor', s.sensor.key);
            currentSensor.set(s.sensor.key);
          }}
        >
          {s.sensor.plotTitleText}
        </button>
        <div class="grow" />
        <div class="toolbar">
          <InfoDialogButton sensor={s.sensor} />
          <button
            class="uk-icon-button uk-icon-button-small"
            class:hidden={!hasRegion}
            title="Show as detail view"
            class:uk-active={detail === s.sensor}
            data-uk-icon="icon: search; ratio: 0.8"
            on:click|stopPropagation={() => {
              trackEvent('side-panel', detail === s.sensor ? 'hide-detail' : 'show-detail', s.sensor.key);
              detail = detail === s.sensor ? null : s.sensor;
            }}
          />
        </div>
      </div>
      <SmallMultiple {s} highlightTimeValue={$highlightTimeValue} {onClick} {onHighlight} />
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style-type: none;
    padding: 0 0 0 0.25em;
  }

  .grow {
    flex-grow: 1;
  }

  li.selected .uk-button-text::before {
    right: 0;
  }

  .header {
    display: flex;
    padding-bottom: 0.1em;
  }

  li {
    margin: 0;
    padding: 0;
  }

  li:hover .toolbar > :global(button),
  li.selected .toolbar > :global(button),
  .toolbar > :global(button):hover,
  .toolbar > :global(button):focus {
    opacity: 1;
  }

  .toolbar {
    font-size: 0.7rem;
    display: flex;
  }
  .toolbar > :global(button) {
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
