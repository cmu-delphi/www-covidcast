<script>
  import { computeSparklineTimeFrame, findDateRow } from './utils';
  import { addMissing, fetchTimeSlice } from '../../data';
  import { primaryValue } from '../../stores/constants';
  import RegionMap from './RegionMap.svelte';
  import HistoryLineChart from './HistoryLineChart.svelte';
  import IndicatorDropdown from './IndicatorDropdown.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import TrendIndicator from './TrendIndicator.svelte';

  /**
   * @type {import("../utils").Params}
   */
  export let params;

  function loadData(sensor, params) {
    const { region, date } = params;
    if (!region || !date) {
      return null;
    }
    const { min, max } = computeSparklineTimeFrame(date, sensor);
    return fetchTimeSlice(sensor, region.level, region.propertyId, min, max, true, {
      displayName: region.displayName,
      geo_value: region.propertyId,
    }).then((rows) => addMissing(rows, sensor));
  }

  function findCurrentRow(data, date) {
    return data ? data.then((rows) => findDateRow(date, rows)) : null;
  }

  $: data = loadData(params.sensor, params);
  $: currentRow = findCurrentRow(data, params.date);
  $: valueKey = primaryValue(params.sensor, {});
</script>

<style>
  .indicator-table {
    margin: 2em 0;
    border-collapse: collapse;
    font-size: 0.75rem;
    line-height: 1rem;
    width: 100%;
  }

  .indicator-table > tr > * {
    padding: 0.5rem 4px;
    vertical-align: top;
  }

  .indicator-table > tr:not(:last-of-type) {
    border-bottom: 1px solid #f0f1f3;
  }

  .indicator-table-value {
    font-weight: 600;
    text-align: right;
  }

  .desc {
    font-size: 0.875rem;
  }
</style>

<FancyHeader sub="Details">INDICATOR</FancyHeader>

<IndicatorDropdown sensor={params.sensor} />

<hr />
<div class="chart-300">
  <RegionMap {params} sensor={params.sensor} />
</div>

<FancyHeader>Performance</FancyHeader>

<div class="chart-150">
  <HistoryLineChart {params} />
</div>
<hr />

<table class="indicator-table">
  <tr>
    <td>Last 7 day trend</td>
    <td class="indicator-table-value">
      <TrendIndicator trend={null} />
    </td>
  </tr>
  <tr>
    <td>Last 7 day avg</td>
    <td class="indicator-table-value">
      {#await currentRow}?{:then row}{row ? params.sensor.formatValue(row[valueKey]) : 'N/A'}{/await}
    </td>
  </tr>
  <tr>
    <td>Peak 7 day period</td>
    <td class="indicator-table-value">TODO</td>
  </tr>
  <tr>
    <td>Record high</td>
    <td class="indicator-table-value">TODO</td>
  </tr>
  <tr>
    <td>Record low</td>
    <td class="indicator-table-value">TODO</td>
  </tr>
</table>

{#if params.sensor.description}
  <FancyHeader>About this indicator</FancyHeader>

  <div class="desc">
    {@html params.sensor.description}
  </div>
{/if}
