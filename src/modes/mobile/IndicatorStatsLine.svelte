<script>
  import { formatValue, formatDateLocal } from '../../formats';
  import { parseAPITime } from '../../data';

  /**
   * @type {import('../../stores/constants').SensorEntry}
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
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  $: dateRow = fetcher.fetch1Sensor1Region1DateDetails(sensor, region, date);

  function formatStdErr(stderr) {
    return `±${formatValue(stderr)}`;
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

<style>
  .stats-line {
    font-style: italic;
    font-size: 0.75rem;
    line-height: 1.5;
    margin-top: 1em;
  }
</style>

<p class="stats-line">
  {#await dateRow then s}
    {s ? `The 7-day average of "${sensor.name}" on ${formatDateLocal(s.date_value)} is based on ${formatSampleSize(s)} samples with a standard error of ${formatStdErr(s.stderr)}. It was published on ${formatIssueDate(s)}.` : ''}
  {/await}
</p>
