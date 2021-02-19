<script>
  import { findDateRow } from './utils';
  import { addMissing, fetchTimeSlice } from '../../data';
  import { timeWeek } from 'd3-time';
  import { primaryValue } from '../../stores/constants';
  import RegionMap from './RegionMap.svelte';
  import HistoryLineChart from './HistoryLineChart.svelte';
  import IndicatorDropdown from './IndicatorDropdown.svelte';

  /**
   * @type {import("../utils").Params}
   */
  export let params;

  function loadData(sensor, params) {
    const { region, date } = params;
    if (!region || !date) {
      return null;
    }
    const startDate = timeWeek.offset(date, -4);
    return fetchTimeSlice(sensor, region.level, region.propertyId, startDate, date, true, {
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
  .chart-line,
  .chart-map {
    position: relative;
  }
  .chart-line > :global(*) {
    width: 100%;
    height: 150px;
  }
  .chart-map > :global(*) {
    width: 100%;
    height: 300px;
  }

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

<h2 class="mobile-fancy-header">INDICATOR <span>Details</span></h2>

<IndicatorDropdown sensor={params.sensor} />

<hr />
<div class="chart-map">
  <RegionMap {params} sensor={params.sensor} />
</div>

<h2 class="mobile-fancy-header">Performance</h2>

<div class="chart-line">
  <HistoryLineChart {params} />
</div>
<hr />

<table class="indicator-table">
  <tr>
    <td>Last 7 day trend</td>
    <td class="indicator-table-value">TODO</td>
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
  <h2 class="mobile-fancy-header">About this indicator</h2>

  <div class="desc">
    {@html params.sensor.description}
  </div>
{/if}
