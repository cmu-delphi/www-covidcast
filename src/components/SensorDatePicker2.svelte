<script>
  import Datepicker from './Calendar/Datepicker.svelte';
  import arrowLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-circle-left.svg';
  import arrowRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-circle-right.svg';
  import calendarIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/calendar.svg';
  import { parseAPITime } from '../data';
  import { times } from '../stores';
  import { formatDateShortAbbr } from '../formats';
  import { timeDay } from 'd3-time';

  /**
   * @type {import('../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * bi-directional binding
   * @type {Date}
   */
  export let value = null;

  export let className = '';

  /**
   * @type {[Date, Date]}
   */
  $: startEndDates = [];
  $: if ($times !== null) {
    const dates = $times.get(sensor.key);
    startEndDates = dates ? dates.map(parseAPITime) : [];
  }
</script>

<style>
  .date-picker {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .selected-date {
    border: none;
    letter-spacing: 3px;
    background: none;
    font-size: 1rem;
  }
  .arrow {
    background: none;
    border: none;
    width: 1.2em;
    padding: 0;
    margin: 0;
  }
  .wide {
    margin-right: 2em;
  }

  .arrow[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>

<div class="date-picker {className}">
  <button
    class="arrow wide"
    disabled={value == null || startEndDates.length === 0 || value.valueOf() === startEndDates[1].valueOf()}
    title="Go to the latest date for which data is available"
    on:click={() => (value = startEndDates[1])}>
    {@html calendarIcon}
  </button>
  <button
    class="arrow"
    title="Go to the previous day"
    disabled={value == null || startEndDates.length === 0 || value <= startEndDates[0]}
    on:click={() => (value = timeDay.offset(value, -1))}>
    {@html arrowLeftIcon}
  </button>
  {#if value != null && startEndDates.length !== 0}
    <Datepicker
      bind:selected={value}
      start={startEndDates[0]}
      end={startEndDates[1]}
      formattedSelected={formatDateShortAbbr(value)}>
      <button aria-label="selected date" class="selected-date" on:>{formatDateShortAbbr(value)}</button>
    </Datepicker>
  {:else}<button aria-label="selected date" class="selected-date" disabled>{formatDateShortAbbr(value)}</button>{/if}
  <button
    class="arrow"
    title="Go to the next day"
    disabled={value == null || startEndDates.length === 0 || value >= startEndDates[1]}
    on:click={() => (value = timeDay.offset(value, 1))}>
    {@html arrowRightIcon}
  </button>
</div>
