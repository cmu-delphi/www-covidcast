<script>
  import { formatDateLocal } from '../formats';
  import { parseAPITime } from '../data';

  /**
   * @type {import('../../stores/constants').Sensor}
   */
  export let sensor;
  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  let loading = false;
  $: dateRow = fetcher.fetch1Sensor1Region1DateDetails(sensor, region, date);

  $: {
    if (dateRow) {
      loading = true;
      dateRow.then(() => {
        loading = false;
      });
    }
  }

  function formatSampleSize(entry) {
    if (!entry || entry.sample_size == null) {
      return 'N/A';
    }
    return Math.floor(entry.sample_size).toLocaleString();
  }

  function formatIssueDate(entry) {
    if (!entry || entry.issue == null) {
      return 'N/A';
    }
    return formatDateLocal(parseAPITime(entry.issue));
  }
</script>

<p class="stats-line" class:loading>
  {#await dateRow}
    The {sensor.valueUnit} of "{sensor.name}" on {formatDateLocal(date.value)} is based on N/A samples. It was published
    on N/A.
  {:then s}
    {#if s}
      The {sensor.valueUnit} of "{sensor.name}" on {formatDateLocal(s.date_value)} is based on {formatSampleSize(s)} samples.
      It was published on {formatIssueDate(s)}.
    {/if}
  {/await}
</p>

<style>
  .stats-line {
    font-style: italic;
    font-size: 0.75rem;
    line-height: 1.5;
    margin-top: 1em;
  }
</style>
