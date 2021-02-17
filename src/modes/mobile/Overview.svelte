<script>
  import { fetchData } from '../../data';
  import { formatDateShort } from '../../formats';
  import { sensorList, sensorMap } from '../../stores';
  import RegionMap from './RegionMap.svelte';
  import SurveyValue from '../survey/SurveyValue.svelte';

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

  function loadHighlightSensors(date, region) {
    const highlights = [
      sensorMap.get('fb-survey-smoothed_wearing_mask'),
      sensorMap.get('fb-survey-smoothed_cli'),
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
  .fancy-header {
    font-size: 18px;
    font-weight: 600;
    line-height: 2rem;
    letter-spacing: 10%;
  }
  .fancy-header span {
    text-transform: uppercase;
    font-weight: 300;
  }
  p {
    font-size: 0.875rem;
  }
  .summary-stats {
    display: flex;
    align-items: flex-start;
  }
  .summary-stats > div {
    margin-right: 2em;
  }

  .chart-map {
    position: relative;
  }
  .chart-map > :global(*) {
    width: 100%;
    height: 300px;
  }
</style>

<h2 class="fancy-header">COVIDcast <span>Indicators</span></h2>

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
  were reported in
  {params.region.displayName}
  on
  {formatDateShort(params.date)}.
</p>

{#each highlightSurveySensors as s}
  <h4>{s.sensor.name}</h4>
  <div>TODO</div>
  <div>
    <div>
      {#await s.value}
        N/A
      {:then d}
        <SurveyValue value={d ? d.value : null} factor={10} />
      {/await}
    </div>
    <div>per 1,000 people</div>
  </div>
{/each}
