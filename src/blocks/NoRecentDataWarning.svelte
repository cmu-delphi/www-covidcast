<script>
  import { formatDateYearDayOfWeekAbbr } from '../formats';
  import { formatAPITime } from '../data';
  /**
   * @type {import("../stores/params").DateParam}
   */
  export let minMaxDate;
  /**
   * @type {import("../stores/params").DateParam}
   */
  export let date;

  export let warningType;

  function switchDate() {
    date.set(minMaxDate);
  }
</script>

{#if warningType === 1}
  <div data-uk-alert class="uk-alert-warning">
    <p>
      This date, {formatDateYearDayOfWeekAbbr(minMaxDate)}, is the most recent that has data for all three of the highlighted
      indicators. You can mouse over the tooltips just below this message to see the latest available date for each indicator.
      Note that the latest available date may be different for each indicator.
    </p>
  </div>
{/if}

{#if warningType === 2}
  <div data-uk-alert class="uk-alert-warning">
    <p>
      This date {formatDateYearDayOfWeekAbbr(date.value)} does not yet have data for all of the highlighted indicators.
      <br />
      <!-- 
        window.location.search.split('&').slice(1).join('&') is used to keep the query parameters except the date parameter.
        So we are getting query params from url, splitting them by & and removing the first element which is date parameter.
      -->
      <a
        href="?date={formatAPITime(minMaxDate)}&{window.location.search.split('&').slice(1).join('&')}"
        on:click={switchDate}>{formatDateYearDayOfWeekAbbr(minMaxDate)}</a
      >
      is the most recent that has data for all three. You can mouse over the tooltips just below this message to see the
      latest available date for each indicator. Note that the latest available date may be different for each indicator.
    </p>
  </div>
{/if}
