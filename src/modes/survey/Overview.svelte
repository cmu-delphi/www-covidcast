<script>
  import { fetchSampleSizesNationSummary } from '../../data';
  import { overviewText, referenceRawNationSignal, refSensor, dataAccessLink, surveyFullTextLink } from './questions';
  import UiKitHint from '../../components/UIKitHint.svelte';
  import { formatDateShort } from '../../formats';
  import SurveyValue from './SurveyValue.svelte';

  function fetchOverview() {
    const sensor = {
      ...refSensor,
      signal: referenceRawNationSignal,
    };

    return fetchSampleSizesNationSummary(sensor);
  }

  const data = fetchOverview();

  function round(value) {
    if (value == null) {
      return null;
    }
    // round to 1000 digits
    return Math.round(value / 1000) * 1000;
  }
</script>

<style>
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

  @media only screen and (max-width: 715px) {
    .summary-button-bar {
      display: block;
    }

    .summary-button-bar > div {
      margin-bottom: 0.5em;
    }
  }
</style>

<div class="mobile-two-col">
  <div class="mobile-kpi">
    <div>
      {#await data}
        <SurveyValue value={null} />
      {:then d}
        <SurveyValue value={round(d.averageSampleSize)} />
      {/await}
    </div>
    <div class="sub">
      Participants daily
      {#await data then d}
        <UiKitHint
          title="Between {formatDateShort(d.minDate)} and {formatDateShort(d.maxDate)} around {round(d.averageSampleSize).toLocaleString()} people participated on average daily in this survey." />
      {/await}
    </div>
  </div>
  <div class="mobile-kpi">
    <div>
      {#await data}
        <SurveyValue value={null} />
      {:then d}
        <SurveyValue value={round(d.totalSampleSize)} />
      {/await}
    </div>
    <div class="sub">
      Survey responses total
      {#await data then d}
        <UiKitHint
          title="Between {formatDateShort(d.minDate)} and {formatDateShort(d.maxDate)} around {round(d.totalSampleSize).toLocaleString()} responses were collected in this survey." />
      {/await}
    </div>
  </div>
</div>

{@html overviewText}

<div class="summary-button-bar">
  <div><a class="uk-button uk-button-default uk-button-delphi" href={surveyFullTextLink}>View full survey</a></div>
  <div><a class="uk-button uk-button-default uk-button-delphi" href={dataAccessLink}>Download aggregate data</a></div>
</div>
