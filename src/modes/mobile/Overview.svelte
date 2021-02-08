<script>
import UiKitHint from "../../components/UIKitHint.svelte";
import { fetchData } from "../../data";
import { formatDateShort } from "../../formats";
import { currentDate, currentDateObject, sensorList, times } from "../../stores";


   /**
   * @type {import("../utils").Params}
   */
  export let params;

  const casesSensor = sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Cases'));
  const deathSensor = sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Deaths'));

  $: minMaxDate = $times.get(casesSensor.key);

  $: casesData = fetchData(casesSensor, params.region.level, params.region.propertyId, $currentDateObject, {
    geo_value: params.region.propertyId,
    time_value: Number.parseInt($currentDate, 10)
  }).then((r) => r[0]);
  $: deathData = fetchData(deathSensor, params.region.level, params.region.propertyId, $currentDateObject, {
    geo_value: params.region.propertyId,
    time_value: Number.parseInt($currentDate, 10)
  }).then((r) => r[0]);


  function formatNumber(v) {
    return v == null ? 'N/A' : v.toLocaleString();
  }
</script>

<style>
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
</style>

<h2>Overview</h2>

<p>
  Our COVID-19 data is compromized of [000] data sources that update on a daily basis.
</p>

<div class="summary-stats">
  <div>
    <div class="summary-stats-number">
      {#await casesData}N/A{:then d}{d ? formatNumber(d.countCumulative) : 'N/A'}{/await}
    </div>
    <div>
      Total Cases
      {#await casesData then d}
        <UiKitHint
          title="Between {formatDateShort(minMaxDate[0])} and {formatDateShort(minMaxDate[1])} around {formatNumber(d.countCumulative)} people were reported having COVID-19." />
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
          title="Between {formatDateShort(minMaxDate[0])} and {formatDateShort(minMaxDate[1])} around {formatNumber(d.countCumulative)} people died because of COVID-19" />
      {/await}
    </div>
  </div>
</div>