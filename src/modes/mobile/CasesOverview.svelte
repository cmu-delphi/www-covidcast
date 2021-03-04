<script>
  import RegionMap from './RegionMap.svelte';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import TrendIndicator from './TrendIndicator.svelte';
  import { CASES, DEATHS } from '../../stores/params';
  import { formatDateShortWeekdayAbbr } from '../../formats';
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

<style>
  h3.header {
    font-size: 1.125rem;
    font-weight: 600;
    text-align: center;
    margin: 0.6em 0;
  }
  h4.header {
    margin: 0;
    margin-bottom: 1em;
    font-size: 0.875rem;
    text-align: center;
  }
</style>

<p>On {formatDateShortWeekdayAbbr(date.value)} the 7 day averages are:</p>

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
        <TrendIndicator trend={null} long sensor={CASES} />
      {:then d}
        <TrendIndicator trend={d} long sensor={CASES} />
      {/await}
    </div>
  </div>
  <div class="mobile-kpi">
    <h3>Deaths</h3>
    <div>
      {#await deathTrend}
        <TrendIndicator trend={null} long sensor={DEATHS} />
      {:then d}
        <TrendIndicator trend={d} long sensor={DEATHS} />
      {/await}
    </div>
  </div>
</div>

<hr />

<h3 class="header">COVID-19 Cases by state</h3>
<h4 class="header">{CASES.value.mapTitleText()}</h4>

<RegionMap {region} {date} sensor={CASES} {fetcher} />
