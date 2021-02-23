<script>
  import { sensorMap } from '../../stores';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import TrendIndicator from './TrendIndicator.svelte';
  import { createSensorParam } from '../../stores/params';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;

  const highlights = [
    sensorMap.get('fb-survey-smoothed_hh_cmnty_cli'),
    sensorMap.get('fb-survey-smoothed_covid_vaccinated_or_accept'),
  ].filter(Boolean);

  $: highlightSurveySensors = highlights.map((h) => ({
    sensor: createSensorParam(h),
    trend: region.fetchTrend(h, date.value),
  }));
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

<FancyHeader sub="Indicators">KEY</FancyHeader>

<div class="highlights">
  {#each highlightSurveySensors as s}
    <div>
      <h3 class="highlight">{s.sensor.value.name}</h3>
      {#await s.trend}
        <TrendIndicator trend={null} long sensor={s.sensor} />
      {:then d}
        <TrendIndicator trend={d} long sensor={s.sensor} />
      {/await}
      <div>
        {#await s.trend}
          N/A
        {:then d}
          <SurveyValue value={d && d.current ? d.current.value : null} factor={10} />
        {/await}
      </div>
      <div class="unit">per 1,000 people</div>
    </div>
  {/each}
</div>
