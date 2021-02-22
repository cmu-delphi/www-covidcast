<script>
  import { fetchData } from '../../data';
  import { formatDateShort } from '../../formats';
  import { sensorList } from '../../stores';
  import RegionMap from './RegionMap.svelte';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import FancyHeader from './FancyHeader.svelte';

  /**
   * @type {import("../utils").Params}
   */
  export let params;

  const casesSensor = sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Cases'));
  const deathSensor = sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Deaths'));

  $: casesData = fetchData(casesSensor, params.region.level, params.region.propertyId, params.date, {
    geo_value: params.region.propertyId,
    time_value: params.timeValue,
  }).then((r) => r[0]);
  $: deathData = fetchData(deathSensor, params.region.level, params.region.propertyId, params.date, {
    geo_value: params.region.propertyId,
    time_value: params.timeValue,
  }).then((r) => r[0]);

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
      {#await casesData}
        N/A
      {:then d}
        <SurveyValue value={d ? d.value : null} />
      {/await}
    </div>
    <div><strong>Total cases</strong> per 100,000 people</div>
    <div>TODO</div>
  </div>
  <div>
    <div>
      {#await deathData}
        N/A
      {:then d}
        <SurveyValue value={d ? d.value : null} />
      {/await}
    </div>
    <div><strong>Total deaths</strong> per 100,000 people</div>
    <div>TODO</div>
  </div>
</div>

<hr />

<h3>
  COVID-19 Cases
  {#if params.region.level === 'nation'}
    by state
  {:else if params.region.level === 'state'}in {params.region.displayName}{:else}around {params.region.displayName}{/if}
</h3>

<h4>{casesSensor.mapTitleText({})}</h4>

<div class="chart-300">
  <RegionMap {params} sensor={casesSensor} />
</div>

<hr />

<FancyHeader sub="Overall" />

<p>
  At least
  <strong>
    {#await deathData}N/A{:then d}{d ? formatNumber(d.count) : 'N/A'}{/await}
    new coronavirus deaths</strong>
  and
  <strong>
    {#await casesData}N/A{:then d}{d ? formatNumber(d.count) : 'N/A'}{/await}
    new cases</strong>
  were reported in
  {params.region.displayName}
  on
  {formatDateShort(params.date)}.
</p>
