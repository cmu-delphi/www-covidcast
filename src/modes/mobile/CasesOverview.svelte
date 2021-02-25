<script>
  import RegionMap from './RegionMap.svelte';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import TrendIndicator from './TrendIndicator.svelte';
  import { CASES, DEATHS } from '../../stores/params';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;

  $: casesTrend = region.fetchTrend(CASES, date.timeFrame, date);
  $: deathTrend = region.fetchTrend(DEATHS, date.timeFrame, date);
</script>

<style>
  h3 {
    font-size: 0.875rem;
    font-weight: 600;
    text-align: center;
    margin: 0.6em 0;
  }

  h4 {
    margin: 0;
    margin-bottom: 1em;
    font-size: 0.65rem;
    text-align: center;
  }
</style>

<FancyHeader sub="Indicators" normal>COVIDcast</FancyHeader>

<p>On <strong>average</strong> over the <strong>last 7 days</strong> there have been</p>

<div class="mobile-two-col">
  <div>
    <div>
      {#await casesTrend}
        N/A
      {:then d}
        <SurveyValue value={d && d.current ? d.current.value : null} />
      {/await}
    </div>
    <div><strong>Total cases</strong> per 100,000 people</div>
    <div>
      {#await casesTrend}
        <TrendIndicator trend={null} long sensor={CASES} />
      {:then d}
        <TrendIndicator trend={d} long sensor={CASES} />
      {/await}
    </div>
  </div>
  <div>
    <div>
      {#await deathTrend}
        N/A
      {:then d}
        <SurveyValue value={d && d.current ? d.current.value : null} />
      {/await}
    </div>
    <div><strong>Total deaths</strong> per 100,000 people</div>
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

<h3>
  COVID-19 Cases
  {#if region.level === 'nation'}
    by state
  {:else if region.level === 'state'}in {region.displayName}{:else}around {region.displayName}{/if}
</h3>

<h4>{CASES.value.mapTitleText({})}</h4>

<div class="chart-250">
  <RegionMap {region} {date} sensor={CASES} height={250} />
</div>
