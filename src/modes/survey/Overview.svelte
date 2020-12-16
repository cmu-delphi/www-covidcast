<script>
  import { fetchSampleSizesNationSummary } from '../../data';
  import { overviewText, referenceRawNationSignal, refSensor } from './questions';
  import UiKitHint from '../../components/UIKitHint.svelte';
  import { formatDateShort } from '../../formats';

  function fetchOverview() {
    const sensor = {
      ...refSensor,
      signal: referenceRawNationSignal,
    };

    return fetchSampleSizesNationSummary(sensor);
  }

  const data = fetchOverview();

  function formatNumber(value) {
    if (value == null || Number.isNaN(value)) {
      return 'N/A';
    }
    // round to 1000 digits
    return (Math.round(value / 1000) * 1000).toLocaleString();
  }
</script>

<style>
  .summary-stats {
    display: flex;
    align-items: flex-start;
  }
  .summary-stats > div {
    margin-right: 2em;
  }
  .summary-stats-number {
    font-size: 2.75rem;
  }
</style>

<h4>Survey Overview</h4>
<div class="summary-stats">
  <div>
    <div class="summary-stats-number">
      {#await data}N/A{:then d}{formatNumber(d.averageSampleSize)}{/await}
    </div>
    <div>
      Participants daily
      {#await data then d}
        <UiKitHint
          title="Between {formatDateShort(d.minDate)} and {formatDateShort(d.maxDate)} around {formatNumber(d.averageSampleSize)} people participated on average daily in the survey" />
      {/await}
    </div>
  </div>
  <div>
    <div class="summary-stats-number">
      {#await data}N/A{:then d}{formatNumber(d.totalSampleSize)}{/await}
    </div>
    <div>
      Participants total
      {#await data then d}
        <UiKitHint
          title="Between {formatDateShort(d.minDate)} and {formatDateShort(d.maxDate)} around {formatNumber(d.totalSampleSize)} people participated in the survey" />
      {/await}
    </div>
  </div>
</div>
<p>
  {@html overviewText}
</p>
