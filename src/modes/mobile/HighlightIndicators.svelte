<script>
  import { fetchData } from '../../data';
  import { sensorMap } from '../../stores';
  import SurveyValue from '../survey/SurveyValue.svelte';

  /**
   * @type {import("../utils").Params}
   */
  export let params;

  function loadHighlightSensors(date, region) {
    const highlights = [
      sensorMap.get('fb-survey-smoothed_hh_cmnty_cli'),
      sensorMap.get('fb-survey-smoothed_covid_vaccinated_or_accept'),
    ].filter(Boolean);
    const data = fetchData(
      {
        ...highlights[0],
        signal: highlights.map((d) => d.signal).join(','),
      },
      region.level,
      region.propertyId,
      date,
      {},
      {
        transferSignal: true,
      },
    );
    return highlights.map((h) => ({
      sensor: h,
      value: data.then((rows) => rows.filter((d) => d.signal === h.signal)[0]),
    }));
  }

  $: highlightSurveySensors = loadHighlightSensors(params.date, params.region);
</script>

<style>
  .highlights {
    display: flex;
  }

  .highlights > div {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
  }

  h3.highlight {
    font-size: 0.875rem;
    margin: 0.6em 0;
    text-align: left;
    font-weight: normal;
    flex-grow: 1;
    line-height: 1.5rem;
  }

  .unit {
    font-size: 0.75rem;
  }
</style>

<h2 class="mobile-fancy-header">KEY <span>Indicators</span></h2>

<div class="highlights">
  {#each highlightSurveySensors as s}
    <div>
      <h3 class="highlight">{s.sensor.name}</h3>
      <div>TODO</div>
      <div>
        {#await s.value}
          N/A
        {:then d}
          <SurveyValue value={d ? d.value : null} factor={10} />
        {/await}
      </div>
      <div class="unit">per 1,000 people</div>
    </div>
  {/each}
</div>
