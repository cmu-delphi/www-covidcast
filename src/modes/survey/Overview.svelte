<script>
  import { fetchSampleSizesNationSummary } from '../../data';
  import { overviewText, referenceRawNationSignal, refSensor, dataAccessLink, surveyFullTextLink } from './questions';
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
    flex-wrap: wrap;
  }
  .summary-stats > div {
    margin-right: 2em;
  }
  .summary-stats-number {
    font-size: 2.75rem;
  }

  .summary-button-bar {
    display: flex;
    justify-content: flex-start;
    text-align: center;
  }

  .summary-button-bar > div {
    flex: 1 1 0;
  }

  .summary-button-bar .uk-button {
    display: block;
  }

  .summary-button-bar-desc {
    font-size: 0.9rem;
  }

  @media only screen and (max-width: 715px) {
    .summary-button-bar {
      display: block;
    }
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
          title="Between {formatDateShort(d.minDate)} and {formatDateShort(d.maxDate)} around {formatNumber(d.averageSampleSize)} people participated on average daily in this survey." />
      {/await}
    </div>
  </div>
  <div>
    <div class="summary-stats-number">
      {#await data}N/A{:then d}{formatNumber(d.totalSampleSize)}{/await}
    </div>
    <div>
      Survey responses total
      {#await data then d}
        <UiKitHint
          title="Between {formatDateShort(d.minDate)} and {formatDateShort(d.maxDate)} around {formatNumber(d.totalSampleSize)} responses were collected in this survey." />
      {/await}
    </div>
  </div>
</div>
{@html overviewText}
<div class="summary-button-bar">
  <div><a class="uk-button uk-button-default uk-button-delphi" href={surveyFullTextLink}>View full survey</a></div>
  <div>
    <a class="uk-button uk-button-default uk-button-delphi" href={dataAccessLink}>Request access to data</a>
    <div class="summary-button-bar-desc">Access for researchers only at this time</div>
  </div>
</div>
