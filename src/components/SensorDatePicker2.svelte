<script>
  import Datepicker from './Calendar/Datepicker.svelte';
  import arrowLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-circle-left.svg';
  import arrowRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-circle-right.svg';
  import calendarIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/calendar.svg';
  import { parseAPITime } from '../data';
  import { times } from '../stores';
  import { formatDateShortWeekdayAbbr } from '../formats';
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

<div class="date-picker {className}">
  <button
    class="arrow-button picker-button arrow-left"
    title="Go to the previous day"
    disabled={value == null || startEndDates.length === 0 || value <= startEndDates[0]}
    on:click={() => (value = timeDay.offset(value, -1))}
  >
    {@html arrowLeftIcon}
  </button>
  {#if value != null && startEndDates.length !== 0}
    <Datepicker
      offset={11}
      bind:selected={value}
      start={startEndDates[0]}
      end={startEndDates[1]}
      formattedSelected={formatDateShortWeekdayAbbr(value)}
    >
      <button
        aria-label="selected date"
        class="selected-date picker-button"
        on:dblclick={() => (value = startEndDates[1])}
        on:
      >
        <span class="selected-date-icon">
          {@html calendarIcon}
        </span>
        <span>{formatDateShortWeekdayAbbr(value)}</span>
      </button>
    </Datepicker>
  {:else}
    <button aria-label="selected date" class="selected-date picker-button" disabled>
      <span class="inline-svg-icon">
        {@html calendarIcon}
      </span>
      <span>{formatDateShortWeekdayAbbr(value)}</span>
    </button>
  {/if}
  <button
    class="arrow-button picker-button arrow-right"
    title="Go to the next day"
    disabled={value == null || startEndDates.length === 0 || value >= startEndDates[1]}
    on:click={() => (value = timeDay.offset(value, 1))}
  >
    {@html arrowRightIcon}
  </button>
</div>

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
    font-size: 0.875rem;
    font-weight: 600;
    padding: 13px;
    line-height: 1;
    white-space: nowrap;
  }

  .arrow-button {
    flex: 0 0 auto;
    box-sizing: content-box;
    background: none;
    border: none;
    padding: 13px;
    width: 14px;
    height: 15px;
  }

  .arrow-left {
    margin-right: 10px; /* 36 - 13*2 */
  }
  .arrow-right {
    margin-left: 10px; /* 36 - 13*2 */
  }

  .picker-button {
    border-radius: 20px;
  }

  .picker-button:hover,
  .picker-button:focus,
  .picker-button:active {
    outline: none !important;
    border: none !important;
    background: rgba(211, 212, 216, 0.25);
  }

  .picker-button[disabled] {
    cursor: not-allowed;
  }

  .selected-date-icon {
    width: 14px;
    display: inline-block;
    margin-right: 0.5em;
  }

  @media only screen and (max-width: 715px) {
    .arrow-button {
      display: none;
    }
    .selected-date-icon {
      width: 12px;
    }
    .selected-date {
      letter-spacing: initial;
      font-size: 0.75rem;
    }
  }
</style>
