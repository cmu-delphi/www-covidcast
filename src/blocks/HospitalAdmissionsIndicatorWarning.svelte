<script>
  import { formatAPITime } from '../data';
  import { formatDateYearDayOfWeekAbbr } from '../formats';
  /**
   * @type {import('../stores/params').SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  function checkSensorData(sensor, date, region) {
    return fetcher.fetch1Sensor1Region1DateDetails(sensor, region, date);
  }
  function switchDate() {
    date.set(sensor.timeFrame.max);
  }

  $: currDate = new Date();
</script>

{#await checkSensorData(sensor, date, region) then hasData}
  {#if !hasData}
    <div data-uk-alert class="uk-alert-warning">
      The indicator "{sensor.name}" is not available for {formatDateYearDayOfWeekAbbr(date.value)}, yet. The latest
      known data is available on
      <a href="?date={formatAPITime(sensor.timeFrame.max)}" on:click={switchDate}
        >{formatDateYearDayOfWeekAbbr(sensor.timeFrame.max)}</a
      >.
    </div>
  {:else if hasData && formatAPITime(date.value) == formatAPITime(sensor.timeFrame.max)}
    <div data-uk-alert class="uk-alert-warning">
      As we dont have data for {formatDateYearDayOfWeekAbbr(currDate)} yet, we are showing you the latest data that was available
      on {formatDateYearDayOfWeekAbbr(sensor.timeFrame.max)}.
    </div>
  {/if}
{/await}
