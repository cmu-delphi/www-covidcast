<script>
  import { formatAPITime } from '../data';
  import { formatDateYearDayOfWeekAbbr } from '../formats';
  import { getLevelInfo } from '../stores';

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
</script>

{#if !sensor.value.levels.includes(region.level)}
  <div data-uk-alert class="uk-alert-warning">
    The indicator "{sensor.name}" does not support the geographic level: {getLevelInfo(region.level).labelPlural}.
  </div>
{:else if sensor.timeFrame.max < date.value}
  {#await checkSensorData(sensor, date, region) then hasData}
    {#if !hasData}
      <div data-uk-alert class="uk-alert-warning">
        The indicator "{sensor.name}" is not available for {formatDateYearDayOfWeekAbbr(date.value)}, yet. The latest
        known data is available on
        <a
          href="?date={formatAPITime(sensor.timeFrame.max)}&{window.location.search.split('&').slice(1).join('&')}"
          on:click={switchDate}>{formatDateYearDayOfWeekAbbr(sensor.timeFrame.max)}</a
        >.
      </div>
    {/if}
  {/await}
{/if}
