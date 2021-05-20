<script>
  import { isMobileDevice, metaDataManager } from '../../../stores';
  import { timeFormat } from 'd3-time-format';
  import Datepicker from '../../../components/Calendar/Datepicker.svelte';
  import { timeDay } from 'd3-time';

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

  $: startEndDates = $metaDataManager.getTimeFrame(sensor);
</script>

<div class="uk-form-controls">
  {#if value != null}
    <Datepicker
      className="uk-width-1-1"
      bind:selected={value}
      start={startEndDates.min}
      end={startEndDates.max}
      formattedSelected={formatTime(value)}
    >
      <button aria-label="selected date" class="uk-input uk-text-nowrap" on:>{formatTime(value)}</button>
    </Datepicker>
  {:else}<button aria-label="selected date" class="uk-input" on:>{formatTime(value)}</button>{/if}
</div>
<div class="uk-button-group shortcuts">
  <button
    class="uk-button uk-button-default"
    disabled={value == null || startEndDates.length === 0 || value <= startEndDates.min}
    title="Go to the previous day"
    on:click={() => (value = timeDay.offset(value, -1))}
    data-uk-icon="icon: chevron-left"
  />
  <button
    class="uk-button uk-button-default"
    disabled={value == null || startEndDates.length === 0 || value >= startEndDates.max}
    title="Go to the next day"
    on:click={() => (value = timeDay.offset(value, 1))}
    data-uk-icon="icon: chevron-right"
  />
  <button
    class="uk-button uk-button-default"
    disabled={value == null || startEndDates.length === 0 || value.valueOf() === startEndDates.max.valueOf()}
    title="Go to the latest date for which '{sensor.name}' is available"
    on:click={() => (value = startEndDates.max)}
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
