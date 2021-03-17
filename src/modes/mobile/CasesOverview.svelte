<script>
  import SurveyValue from '../survey/SurveyValue.svelte';
  import TrendIndicator from './TrendIndicator.svelte';
  import { CASES, DEATHS } from '../../stores/params';
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

  $: casesTrend = fetcher.fetchWindowTrend(CASES, region, date);
  $: deathTrend = fetcher.fetchWindowTrend(DEATHS, region, date);
</script>

<p>On {formatDateWeekday(date.value)}, the {CASES.valueUnit}s were:</p>

<div class="mobile-two-col">
  <div class="mobile-kpi">
    <h3>Cases</h3>
    <div>
      {#await casesTrend}
        <SurveyValue value={null} />
      {:then d}
        <SurveyValue value={d && d.current ? d.current.value : null} />
      {/await}
    </div>
    <div class="sub">
      <SensorUnit sensor={CASES} long />
    </div>
  </div>
  <div class="mobile-kpi">
    <h3>Deaths</h3>
    <div>
      {#await deathTrend}
        <SurveyValue value={null} />
      {:then d}
        <SurveyValue value={d && d.current ? d.current.value : null} />
      {/await}
    </div>
    <div class="sub">
      <SensorUnit sensor={CASES} long />
    </div>
  </div>
</div>

<p>Compared to the previous week that means:</p>

<div class="mobile-two-col">
  <div class="mobile-kpi">
    <h3>Cases</h3>
    <div>
      {#await casesTrend}
        <TrendIndicator trend={null} long />
      {:then d}
        <TrendIndicator trend={d} long />
      {/await}
    </div>
  </div>
  <div class="mobile-kpi">
    <h3>Deaths</h3>
    <div>
      {#await deathTrend}
        <TrendIndicator trend={null} long />
      {:then d}
        <TrendIndicator trend={d} long />
      {/await}
    </div>
  </div>
</div>
