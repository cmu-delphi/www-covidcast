<script>
  import { isMobileDevice, times } from '../stores';
  import { timeFormat } from 'd3-time-format';
  import Datepicker from './Calendar/Datepicker.svelte';
  import { timeDay } from 'd3-time';
  import IoIosCalendar from 'svelte-icons/io/IoIosCalendar.svelte';
  import IoIosArrowBack from 'svelte-icons/io/IoIosArrowBack.svelte';
  import IoIosArrowForward from 'svelte-icons/io/IoIosArrowForward.svelte';
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

<style>
  :global(.datepicker) {
    margin: 0.25em 0;
  }

  .shortcuts {
    background-color: #ececec;
    border: none;
    color: #111;
    line-height: 1.3;
    height: 2.2em;
    font-size: 80%;
    margin-left: 0.5em;
  }

  /** mobile **/
  @media only screen and (max-width: 767px) {
    .shortcuts {
      display: none;
    }
  }
</style>

{#if value != null && startEndDates.length !== 0}
  <Datepicker
    bind:selected={value}
    start={startEndDates[0]}
    end={startEndDates[1]}
    formattedSelected={formatTime(value)}>
    <button aria-label="selected date" class="option-picker base-font-size" on:>{formatTime(value)}</button>
  </Datepicker>
{:else}<button aria-label="selected date" class="option-picker base-font-size" on:>{formatTime(value)}</button>{/if}
<div class="shortcuts pg-button-group">
  <button
    class="pg-button"
    disabled={value == null || startEndDates.length === 0 || value <= startEndDates[0]}
    title="Go to the previous day"
    on:click={() => (value = timeDay.offset(value, -1))}>
    <IoIosArrowBack />
  </button>
  <button
    class="pg-button"
    disabled={value == null || startEndDates.length === 0 || value.valueOf() === startEndDates[1].valueOf()}
    title="Go to the latest date for which '{sensor.name}' is available"
    on:click={() => (value = startEndDates[1])}>
    <IoIosCalendar />
  </button>
  <button
    class="pg-button"
    disabled={value == null || startEndDates.length === 0 || value >= startEndDates[1]}
    title="Go to the next day"
    on:click={() => (value = timeDay.offset(value, 1))}>
    <IoIosArrowForward />
  </button>
</div>
