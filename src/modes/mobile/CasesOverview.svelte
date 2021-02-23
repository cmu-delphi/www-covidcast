<script>
  import { formatDateShort } from '../../formats';
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

  $: casesTrend = region.fetchTrend(CASES.value, date.value);
  $: casesDateData = date.fetchRegion(CASES.value, region.value);
  $: deathTrend = region.fetchTrend(DEATHS.value, date.value);
  $: deathDateData = date.fetchRegion(DEATHS.value, region.value);

  function formatNumber(v) {
    return v == null ? 'N/A' : v.toLocaleString();
  }
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
    font-size: 0.65rem;
    text-align: center;
  }

  .summary-stats {
    display: flex;
    align-items: flex-start;
    font-size: 0.75rem;
  }
  .summary-stats > div {
    margin-right: 2em;
  }
</style>

<FancyHeader sub="Indicators">COVIDcast</FancyHeader>

<p>On <strong>average</strong> over the <strong>last 7 days</strong> there have been</p>

<div class="summary-stats">
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
      {/await}>
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

<h4>{CASES.mapTitleText({})}</h4>

<div class="chart-250">
  <RegionMap {region} {date} sensor={CASES} height={250} />
</div>

<hr />

<FancyHeader sub="Overall" />

<p>
  At least
  <strong>
    {#await deathDateData}N/A{:then d}{d ? formatNumber(d.count) : 'N/A'}{/await}
    new coronavirus deaths</strong>
  and
  <strong>
    {#await casesDateData}N/A{:then d}{d ? formatNumber(d.count) : 'N/A'}{/await}
    new cases</strong>
  were reported in
  {region.displayName}
  on
  {formatDateShort(date.value)}.
</p>
