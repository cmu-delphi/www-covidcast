<script>
  import Datepicker from './Calendar/Datepicker.svelte';
  import arrowLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-circle-left.svg';
  import arrowRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-circle-right.svg';
  import calendarIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/calendar.svg';
  import { isMobileDevice, metaDataManager } from '../stores';
  import { formatDateShortDayOfWeekAbbr, formatDateYearDayOfWeekAbbr, formatWeek } from '../formats';
  import { timeDay } from 'd3-time';
  import { yesterdayDate } from '../data/TimeFrame';

  /**
   * @type {import('../stores/constants').Sensor}
   */
  export let sensor;

  /**
   * bi-directional binding
   * @type {Date}
   */
  export let value = null;

  export let className = '';
  /**
   * @type {import("../../stores/DataFetcher").DataFetcher | null}
   */
  export let fetcher = null;

  $: info = $metaDataManager.getMetaData(sensor);
  $: maxTimeAndIssue = fetcher
    ? fetcher.fetch1SensorMaxDateAndIssue(sensor, $metaDataManager)
    : info
    ? Promise.resolve(info)
    : null;

  $: timeFrame = $metaDataManager.getTimeFrame(sensor);

  $: formatter = $isMobileDevice ? formatDateShortDayOfWeekAbbr : formatDateYearDayOfWeekAbbr;
</script>

<div class="date-picker {className}">
  <button
    class="arrow-button picker-button arrow-left"
    title="Go to the previous {sensor.isWeeklySignal ? 'week' : 'day'}"
    disabled={value == null || value <= timeFrame.min}
    on:click={() => (value = timeDay.offset(value, sensor.isWeeklySignal ? -7 : -1))}
  >
    {@html arrowLeftIcon}
  </button>
  {#if value != null}
    <Datepicker
      offset={11}
      bind:selected={value}
      start={timeFrame.min}
      end={yesterdayDate}
      pickWeek={sensor.isWeeklySignal}
      formattedSelected={sensor.isWeeklySignal ? formatWeek(value) : formatter(value)}
    >
      <button
        aria-label="selected date"
        class="selected-date picker-button"
        on:dblclick={() => (value = yesterdayDate)}
      >
        <span class="selected-date-icon">
          {@html calendarIcon}
        </span>
        <span>{sensor.isWeeklySignal ? formatWeek(value) : formatter(value)}</span>
      </button>
      <svelte:fragment slot="footer">
        {#if info}
          {#await maxTimeAndIssue then t}
            <p class="date-info">
              Data is available for dates up through <button
                type="button"
                on:click={() => (value = t.maxTime)}
                class="uk-link-muted"
              >
                {sensor.isWeeklySignal ? formatWeek(t.maxTime) : formatDateYearDayOfWeekAbbr(t.maxTime)}
              </button>
              (last updated on
              <span class="uk-text-nowrap"
                >{sensor.isWeeklySignal ? formatWeek(t.maxIssue) : formatDateYearDayOfWeekAbbr(t.maxIssue)}</span
              >).
            </p>
          {/await}
        {/if}
      </svelte:fragment>
    </Datepicker>
  {:else}
    <button aria-label="selected date" class="selected-date picker-button" disabled>
      <span class="inline-svg-icon">
        {@html calendarIcon}
      </span>
      <span>{sensor.isWeeklySignal ? formatWeek(value) : formatter(value)}</span>
    </button>
  {/if}
  <button
    class="arrow-button picker-button arrow-right"
    title="Go to the next {sensor.isWeeklySignal ? 'week' : 'day'}"
    disabled={value == null || value >= yesterdayDate}
    on:click={() => (value = timeDay.offset(value, sensor.isWeeklySignal ? 7 : 1))}
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
    letter-spacing: 1px;
    background: none;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 10px;
    line-height: 1;
    white-space: nowrap;
  }

  .arrow-button {
    flex: 0 0 auto;
    box-sizing: content-box;
    background: none;
    border: none;
    padding: 10px;
    margin: 3px 0;
    width: 14px;
    height: 15px;
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

  .date-info {
    margin: 0;
    padding: 0 0.5em 0.5em 0.5em;
    text-align: left;
    font-size: 0.875rem;
  }

  .date-info > button {
    white-space: nowrap;
    display: inline-block;
    padding: 0;
    cursor: pointer;
    border: none;
    background: none;
    text-align: left;
    font: inherit;
    font-size: inherit;
    color: inherit;
    text-decoration: underline;
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
