<script>
  import { sensorMap } from '../../stores';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import TrendIndicator from './TrendIndicator.svelte';
  import { SensorParam } from '../../stores/params';

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
    sensor: new SensorParam(h),
    trend: region.fetchTrend(h, date.timeFrame, date),
  }));
</script>

<FancyHeader sub="Indicators">Key</FancyHeader>

<div class="mobile-two-col">
  {#each highlightSurveySensors as s}
    <div>
      <h3>{s.sensor.value.name}</h3>
      <div>
        {#await s.trend}
          <TrendIndicator trend={null} long sensor={s.sensor} />
        {:then d}
          <TrendIndicator trend={d} long sensor={s.sensor} />
        {/await}
      </div>
      <div>
        {#await s.trend}
          N/A
        {:then d}
          <SurveyValue value={d && d.current ? d.current.value : null} factor={10} />
        {/await}
      </div>
      <div class="sub">per 1,000 people</div>
    </div>
  {/each}
</div>
