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

  function switchDate() {
    date.set(minMaxDate);
  }
</script>

<!-- We are not going to show any king of warning message in case the choosen date is less than the most recent date that has data for all three indicators. -->

<!-- If the choosen date is the same as the most recent date that has data for all three indicators, show this message. -->
{#if minMaxDate.getTime() === date.value.getTime()}
  <div data-uk-alert class="uk-alert-warning">
    <p>
      This date, {formatDateYearDayOfWeekAbbr(minMaxDate)}, is the most recent that has data for all three of the
      highlighted indicators. You can mouse over the tooltips just below this message to see the latest available date
      for each indicator. Note that the latest available date may be different for each indicator.
    </p>
  </div>
{/if}

<!-- If the chosen date is greater than the most recent date that has data for all three indicators, show this message. -->
{#if minMaxDate.getTime() < date.value.getTime()}
  <div data-uk-alert class="uk-alert-warning">
    <p>
      This date ({formatDateYearDayOfWeekAbbr(date.value)}) does not yet have data for all of the highlighted
      indicators.
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
