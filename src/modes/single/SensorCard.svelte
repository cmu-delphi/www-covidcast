<script>
  import VegaTooltip from '../../components/DetailView/VegaTooltip.svelte';
  import InfoDialogButton from '../../components/InfoDialogButton.svelte';
  import Vega from '../../components/Vega.svelte';
  import { formatAPITime, parseAPITime } from '../../data';
  import { formatDateLocal } from '../../formats';
  import { smallMultipleTimeSpan } from '../../stores';
  import { prepareSensorData } from '../overview/vegaSpec';

  /**
   * @type {import("../../stores/constants").SensorEntry}
   */
  export let sensor;

  /**
   * @type {Date}
   */
  export let date;
  export let lag = 0;

  export let onHighlight;
  export let highlightTimeValue;

  $: lagMS = 1000 * 3600 * 24 * lag;
  $: highlightDate = highlightTimeValue != null ? new Date(parseAPITime(highlightTimeValue).getTime() - lagMS) : null;

  // use local variables with manual setting for better value comparison updates
  $: startDay = new Date($smallMultipleTimeSpan[0].getTime() - lagMS);
  $: endDay = new Date($smallMultipleTimeSpan[1].getTime() - lagMS);

  $: newStartDay = new Date($smallMultipleTimeSpan[0].getTime() - lagMS);
  $: newEndDay = new Date($smallMultipleTimeSpan[1].getTime() - lagMS);

  $: {
    if (startDay.getTime() !== newStartDay.getTime()) {
      startDay = newStartDay;
    }
    if (endDay.getTime() !== newEndDay.getTime()) {
      endDay = newEndDay;
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
    margin-left: 1em;
    padding: 0.5em;
    max-width: 30em;
    line-height: 1.1em;
  }

  .key-fact {
    margin-left: 1em;
    font-weight: bold;
    font-size: 120%;
    text-align: right;
    padding-right: 1em;
  }

  .legend::before {
    color: var(--color);
    content: '\25FC';
    padding-right: 0.2em;
  }

  .hint {
    margin-left: 1em;
    vertical-align: middle;
  }

  .key.single .legend {
    display: none;
    width: 0;
  }
  .key.single td {
    border: none;
  }

  /* Note that for table layout, the exact width doesn't matter, 
     but the relative proportion between column widths does. */
  .key .valueCol {
    width: 50px;
  }

  .key .dateCol {
    width: 30px;
  }

  .key.single .locationCol {
    width: 60px;
  }

  .key.single .dateCol {
    width: 30px;
  }
</style>

<section class="uk-card uk-card-body uk-card-default uk-card-small card" data-testid="sensor-{sensor.key}">
  <div class="uk-card-header">
    <h3 class="uk-card-title uk-margin-remove-bottom">{sensor.plotTitleText}</h3>
    <div class="toolbar">
      <InfoDialogButton {sensor} />
    </div>
  </div>
  <div class="grow" />
  <table class="key" class:single={selections.length === 1}>
    <colgroup>
      <col class="locationCol" />
      <col class="valueCol" />
      <col class="dateCol" />
    </colgroup>
    <tbody>
      {#each selections as selection, i}
        <tr>
          <td class="legend" style="--color: {i === 0 ? 'grey' : selection.color}">{selection.displayName}</td>
          <td class="key-fact">{values[i] != null ? sensor.formatValue(values[i]) : '?'}</td>
          {#if i === 0}
            <td class="hint" rowspan={selections.length}>on {formatDateLocal(highlightDate ? highlightDate : date)}</td>
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
