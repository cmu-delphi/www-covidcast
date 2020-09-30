<script>
  import { currentDateObject, stats, yesterdayDate } from '../../stores';
  import { createSpec } from '../overview/vegaSpec';
  import Vega from '../../components/Vega.svelte';
  import { parseAPITime } from '../../data';
  import { fetchTimeSlice } from '../../data/fetchData';
  import VegaTooltip from '../../components/DetailView/VegaTooltip.svelte';
  import { determineMinMax } from '../../components/MapBox/colors';
  import { MAP_THEME } from '../../theme';
  import { primaryValue } from '../../stores/constants';

  /**
   * @type {import('../../maps').NameInfo}
   */
  export let row;

  $: id = row.propertyId;

  /**
   * @type {string}
   */
  export let level;

  // Create a date for today in the API's date format
  const startDay = parseAPITime('20200401');
  const finalDay = yesterdayDate;

  export let highlightTimeValue;
  export let onHighlight;

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;
  /**
   * @type {import('../../data/fetchData').EpiDataRow}
   */
  export let single;

  export let ratioOptions;

  $: field = primaryValue(sensor, ratioOptions);
  $: cumulativeField = primaryValue(sensor, {
    ...ratioOptions,
    cumulative: true,
  });

  $: data = fetchTimeSlice(sensor, level, id, startDay, finalDay, true, {
    geo_value: id,
    stderr: null,
  });

  $: domain = determineMinMax($stats, sensor, level, ratioOptions);

  $: patchedSpec = createSpec(sensor, [{ info: row, color: MAP_THEME.selectedRegionOutline }], null, {
    field: sensor.format !== 'percent' ? field : undefined,
    domain,
  });
</script>

<style>
  .right {
    text-align: right;
  }

  .chart {
    width: 18em;
    height: 4em;
    position: relative;
    padding: 0;
    box-sizing: border-box;
  }

  .chart > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }

  td {
    border: 0;
  }

  .date {
    display: block;
    font-size: 0.5em;

    letter-spacing: 0.025em;
    line-height: 1em;
    color: var(--red);
  }
</style>

{#if sensor.isCasesOrDeath}
  <td class="right">
    {single && single[field] != null ? sensor.formatValue(single[field]) : 'Unknown'}
    <span class="date">{$currentDateObject.toLocaleDateString()}</span>
  </td>
  <td class="right">
    {single && single[cumulativeField] != null ? sensor.formatValue(single[cumulativeField]) : 'Unknown'}
    <span class="date">{$currentDateObject.toLocaleDateString()}</span>
    <span class="date">(cumulative)</span>
  </td>
{:else}
  <td class="right">
    {single && single.value != null ? sensor.formatValue(single.value) : 'Unknown'}
    <span class="date">{$currentDateObject.toLocaleDateString()}</span>
  </td>
{/if}
<td class="chart">
  <Vega
    {data}
    spec={patchedSpec}
    signals={{ currentDate: $currentDateObject, highlightTimeValue }}
    signalListeners={['highlight']}
    on:signal={onHighlight}
    tooltip={VegaTooltip}
    tooltipProps={{ sensor }} />
</td>
