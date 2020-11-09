<script>
  import { timeFormat } from 'd3-time-format';
  import VegaTooltip from '../../components/DetailView/VegaTooltip.svelte';
  import InfoDialogButton from '../../components/InfoDialogButton.svelte';
  import Vega from '../../components/Vega.svelte';
  import { formatAPITime, parseAPITime } from '../../data';
  import { smallMultipleTimeSpan } from '../../stores';
  import { prepareSensorData } from '../overview/vegaSpec';

  const formatLocal = timeFormat('%x');
  /**
   * @type {import("../../stores/constants").SensorEntry}
   */
  export let sensor;

  /**
   * @type {Date}
   */
  export let date;

  export let onHighlight;
  export let highlightTimeValue;

  $: highlightDate = highlightTimeValue != null ? parseAPITime(highlightTimeValue) : null;

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
   * @type {import('../../stores').CompareSelection[]}
   */
  export let selections = [];

  $: sensorWithData = prepareSensorData(sensor, selections, startDay, endDay);

  /**
   * @type {(number | null)[]}
   */
  let values = selections.map(() => null);

  $: {
    const keyDate = formatAPITime(highlightDate ? highlightDate : date);
    Promise.resolve(sensorWithData.data).then((rows) => {
      values = selections.map((region) => {
        const row = rows.find((d) => String(d.time_value) === keyDate && d.geo_value === region.info.propertyId);
        return row ? row.value : null;
      });
    });
  }
</script>

<style>
  .card {
    margin: 0.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .uk-card-header {
    position: relative;
    align-self: stretch;
  }

  .toolbar {
    position: absolute;
    right: 0.5em;
    top: 50%;
    transform: translate(0, -50%);
  }

  .grow {
    flex: 1 1 0;
  }

  .vega-wrapper {
    align-self: stretch;
    flex: 0 0 8em;
    position: relative;
  }

  .vega-wrapper > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 2px;
    bottom: 0;
  }

  .key {
    margin: 0;
    padding: 0.5em;
    border: none;
  }

  .key-fact {
    font-weight: bold;
    font-size: 120%;
  }

  .legend::before {
    color: var(--color);
    content: '\25FC';
    padding-right: 0.2em;
  }

  .hint {
    vertical-align: middle;
  }

  .key.single .legend {
    display: none;
  }
  .key.single td {
    border: none;
  }
</style>

<section class="uk-card uk-card-body uk-card-default uk-card-small card" data-testid="sensor-{sensor.key}">
  <div class="uk-card-header">
    <h3 class="uk-card-title uk-margin-remove-bottom">
      {typeof sensor.mapTitleText === 'function' ? sensor.mapTitleText() : sensor.name}
    </h3>
    <div class="toolbar">
      <InfoDialogButton {sensor} />
    </div>
  </div>
  <div class="grow" />
  <table class="key" class:single={selections.length === 1}>
    <tbody>
      {#each selections as selection, i}
        <tr>
          <td class="legend" style="--color: {selection.color}">{selection.displayName}</td>
          <td class="key-fact">{values[i] != null ? sensor.formatValue(values[i]) : '?'}</td>
          {#if i === 0}
            <td class="hint" rowspan={selections.length}>on {formatLocal(highlightDate ? highlightDate : date)}</td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
  <main class="vega-wrapper">
    <Vega
      data={sensorWithData.data}
      spec={sensorWithData.spec}
      noDataText={sensorWithData.noDataText}
      signals={{ currentDate: date, highlightTimeValue }}
      signalListeners={['highlight']}
      on:signal={onHighlight}
      tooltip={VegaTooltip}
      tooltipProps={{ sensor }} />
  </main>
</section>
