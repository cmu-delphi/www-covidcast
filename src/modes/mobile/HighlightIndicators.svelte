<script>
  import { sensorMap } from '../../stores';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import TrendIndicator from './TrendIndicator.svelte';
  import { SensorParam } from '../../stores/params';
  import { formatDateWeekday } from '../../formats';
  import SensorUnit from './SensorUnit.svelte';

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

  const highlights = [
    sensorMap.get('fb-survey-smoothed_hh_cmnty_cli'),
    sensorMap.get('fb-survey-smoothed_covid_vaccinated_or_accept'),
  ].filter(Boolean);

  $: highlightSurveySensors = highlights.map((h) => ({
    sensor: new SensorParam(h),
    trend: fetcher.fetchWindowTrend(h, region, date),
  }));
</script>

<FancyHeader sub="Indicators">Key</FancyHeader>

<p>On {formatDateWeekday(date.value)}, the 7-day averages were:</p>

<div class="mobile-two-col">
  {#each highlightSurveySensors as s}
    <div class="mobile-kpi">
      <h3>{s.sensor.name}</h3>
      <div>
        {#await s.trend}
          <SurveyValue value={null} />
        {:then d}
          <SurveyValue value={d && d.current ? d.current.value : null} digits={2} />
        {/await}
      </div>
      <div class="sub">
        <SensorUnit sensor={s.sensor} long />
      </div>
    </div>
  {/each}
</div>

<p>Compared to the previous week that means:</p>

<div class="mobile-two-col">
  {#each highlightSurveySensors as s}
    <div class="mobile-kpi">
      <div>
        {#await s.trend}
          <TrendIndicator trend={null} long sensor={s.sensor} />
        {:then d}
          <TrendIndicator trend={d} long sensor={s.sensor} />
        {/await}
      </div>
    </div>
  {/each}
</div>
