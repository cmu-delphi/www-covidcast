<script>
  import { fetchSampleSizesNationSummary } from '../../data';
  import { referenceRawNationSignal, refSensor } from './questions';
  import UiKitHint from '../../components/UIKitHint.svelte';
  import { formatDateShort } from '../../formats';
  import SurveyValue from './SurveyValue.svelte';

  export let className = '';

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

<div class="mobile-two-col {className}">
  <div class="mobile-kpi">
    <div>
      {#await data}
        <SurveyValue value={null} />
      {:then d}
        <SurveyValue value={round(d.averageSampleSize)} />
      {/await}
    </div>
    <div class="subheader">
      Daily survey participants
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
    <div class="subheader">
      Total survey responses
      {#await data then d}
        <UiKitHint
          title="Between {formatDateShort(d.minDate)} and {formatDateShort(d.maxDate)} around {round(d.totalSampleSize).toLocaleString()} responses were collected in this survey." />
      {/await}
    </div>
  </div>
</div>
