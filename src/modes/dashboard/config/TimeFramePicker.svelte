<script>
  import { formatDateISO } from '../../../formats';

  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;

  export let value = '';
  let useDefault = value === '' ? 'window' : typeof value === 'string' ? 'sensor' : '';
</script>

<div>
  <label for="widget-adder-t" class="uk-form-label">Time Range</label>
  <div class="flex">
    <label>
      <input class="uk-radio" type="radio" bind:group={useDefault} name="_timeFrame" value="window" /> Use Derived 4-Month
      Range
    </label>
    <label>
      <input class="uk-radio" type="radio" bind:group={useDefault} name="_timeFrame" value="sensor" /> Use Configured Sensor
      Data Range
    </label>
    <label>
      <input class="uk-radio" type="radio" bind:group={useDefault} name="_timeFrame" value="" /> Specify Date Range
    </label>
  </div>
  {#if useDefault === 'window'}
    <input
      id="widget-adder-t"
      class="uk-input"
      type="date"
      value={formatDateISO(date.windowTimeFrame.min)}
      disabled
      readonly
    />
    <input class="uk-input" type="date" value={formatDateISO(date.windowTimeFrame.max)} disabled readonly />
  {:else if useDefault === 'sensor'}
    <input type="hidden" name="timeFrame" value="sensor" />
    <input
      id="widget-adder-t"
      class="uk-input"
      type="date"
      value={formatDateISO(sensor.timeFrame.min)}
      disabled
      readonly
    />
    <input class="uk-input" type="date" value={formatDateISO(sensor.timeFrame.max)} disabled readonly />
  {:else}
    <input
      id="widget-adder-t"
      class="uk-input"
      type="date"
      value={value && value.min ? value.min : formatDateISO(date.windowTimeFrame.min)}
      name="timeFrame.min"
      step="1"
    />
    <input
      class="uk-input"
      type="date"
      value={value && value.max ? value.max : formatDateISO(date.windowTimeFrame.max)}
      name="timeFrame.max"
      step="1"
    />
  {/if}
</div>

<style>
  .flex {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.5em;
  }
</style>
