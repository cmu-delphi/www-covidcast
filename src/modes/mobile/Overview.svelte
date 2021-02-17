<script>
  import UiKitHint from '../../components/UIKitHint.svelte';
  import { fetchData } from '../../data';
  import { formatDateLocal, formatDateShort } from '../../formats';
  import { sensorList, times } from '../../stores';
  import HistoryLineChart from './HistoryLineChart.svelte';
  import RegionMap from './RegionMap.svelte';

  /**
   * @type {import("../utils").Params}
   */
  export let params;

  const casesSensor = sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Cases'));
  const deathSensor = sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Deaths'));

  $: minMaxDate = $times.get(casesSensor.key);

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
  p {
    font-size: 0.875rem;
  }
  .summary-stats {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .summary-stats > div {
    margin-right: 2em;
  }
  .summary-stats-number {
    font-size: 2.75rem;
  }

  .chart-map,
  .chart-line {
    position: relative;
  }
  .chart-map > :global(*) {
    width: 100%;
    height: 300px;
  }
  .chart-line > :global(*) {
    width: 100%;
    height: 150px;
  }

  .trend {
    text-align: center;
  }
</style>

<h2>Overview</h2>

<div class="summary-stats">
  <div>
    <div class="summary-stats-number">
      {#await casesData}N/A{:then d}{d ? formatNumber(d.countCumulative) : 'N/A'}{/await}
    </div>
    <div>
      Total Cases
      {#await casesData then d}
        <UiKitHint
          title="Between {formatDateLocal(minMaxDate[0])} and {formatDateLocal(minMaxDate[1])} around {formatNumber(d.countCumulative)} people were reported having COVID-19." />
      {/await}
    </div>
  </div>
  <div>
    <div class="summary-stats-number">
      {#await deathData}N/A{:then d}{d ? formatNumber(d.countCumulative) : 'N/A'}{/await}
    </div>
    <div>
      Total Deaths
      {#await deathData then d}
        <UiKitHint
          title="Between {formatDateLocal(minMaxDate[0])} and {formatDateLocal(minMaxDate[1])} around {formatNumber(d.countCumulative)} people died because of COVID-19" />
      {/await}
    </div>
  </div>
</div>

<div class="chart-map">
  <RegionMap {params} sensor={casesSensor} />
</div>

<p>
  At least
  <strong>
    {#await deathData}N/A{:then d}{d ? formatNumber(d.count) : 'N/A'}{/await}
    new coronavirus deaths</strong>
  and
  <strong>
    {#await casesData}N/A{:then d}{d ? formatNumber(d.count) : 'N/A'}{/await}
    new cases</strong>
  wree reported in
  {params.region.displayName}
  on
  {formatDateShort(params.date)}.
</p>

<div class="chart-line">
  <HistoryLineChart {params} sensor={casesSensor} />
</div>
<div class="trend">[percent] [trend] in cases</div>
<p>
  Over the past week, there has been an
  <strong>average of
    {#await casesData}N/A{:then d}{d ? formatNumber(d.avg) : 'N/A'}{/await}
    cases per day</strong>, a
  <strong>[trend] of [xx] percent</strong>
  from average two weeks earlier.
</p>

<div class="chart">TODO line chart of vaccines</div>
<div class="trend">[percent] [trend] in vaccines administered</div>

<p><strong>[00] vaccines</strong> were administered in the past 7 days.</p>
<p>
  <strong>[name of county and state]</strong>
  are leading with
  <strong>[xx]</strong>
  vaccines administered in the
  <strong>past 7 days</strong>.
</p>
