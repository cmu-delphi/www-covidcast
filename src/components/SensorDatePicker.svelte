<script>
  import { isMobileDevice, times } from '../stores';
  import { timeFormat } from 'd3-time-format';
  import Datepicker from './Calendar/Datepicker.svelte';
  import { timeDay } from 'd3-time';
  import { parseAPITime } from '../data';

  $: formatTime = $isMobileDevice ? timeFormat('%x') : timeFormat('%B %-d, %Y');

  /**
   * @type {import('../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * bi-directional binding
   * @type {Date}
   */
  export let value = null;

  /**
   * @type {[Date, Date]}
   */
  $: startEndDates = [];
  $: if ($times !== null) {
    const dates = $times.get(sensor.key);
    startEndDates = dates ? dates.map(parseAPITime) : [];
  }
</script>

<div class="uk-form-controls">
  {#if value != null && startEndDates.length !== 0}
    <Datepicker
      className="uk-width-1-1"
      bind:selected={value}
      start={startEndDates[0]}
      end={startEndDates[1]}
      formattedSelected={formatTime(value)}
    >
      <button aria-label="selected date" class="uk-input uk-text-nowrap" on:>{formatTime(value)}</button>
    </Datepicker>
  {:else}<button aria-label="selected date" class="uk-input" on:>{formatTime(value)}</button>{/if}
</div>
<div class="uk-button-group shortcuts">
  <button
    class="uk-button uk-button-default"
    disabled={value == null || startEndDates.length === 0 || value <= startEndDates[0]}
    title="Go to the previous day"
    on:click={() => (value = timeDay.offset(value, -1))}
    data-uk-icon="icon: chevron-left"
  />
  <button
    class="uk-button uk-button-default"
    disabled={value == null || startEndDates.length === 0 || value >= startEndDates[1]}
    title="Go to the next day"
    on:click={() => (value = timeDay.offset(value, 1))}
    data-uk-icon="icon: chevron-right"
  />
  <button
    class="uk-button uk-button-default"
    disabled={value == null || startEndDates.length === 0 || value.valueOf() === startEndDates[1].valueOf()}
    title="Go to the latest date for which '{sensor.name}' is available"
    on:click={() => (value = startEndDates[1])}
    data-uk-icon="icon: chevron-right-end"
  />
</div>

<style>
  .shortcuts > button {
    padding: 0 2px;
  }

  /** mobile **/
  @media only screen and (max-width: 767px) {
    .shortcuts {
      display: none;
    }
  }
</style>
