<script>
  import { currentDateObject } from '../../stores';
  import { createSpec } from '../overview/vegaSpec';
  import Vega from '../../components/Vega.svelte';
  import VegaTooltip from '../../components/DetailView/VegaTooltip.svelte';
  import { MAP_THEME } from '../../theme';
  import { primaryValue } from '../../stores/constants';

  /**
   * @type {import('../../maps').NameInfo}
   */
  export let row;

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

  export let data = Promise.resolve([]);
  export let domain = Promise.resolve([0, 100]);

  $: field = primaryValue(sensor, ratioOptions);
  $: cumulativeField = primaryValue(sensor, {
    ...ratioOptions,
    cumulative: true,
  });

  $: patchedSpec = createSpec(sensor, [{ info: row, color: MAP_THEME.selectedRegionOutline }], null, {
    field: sensor.format !== 'percent' ? field : undefined,
    // domain: [0, 100],  // 100 only makes sense for 100%.
  });

  let loading = false;
  $: {
    loading = true;
    domain.then((domainValues) => {
      patchedSpec = createSpec(sensor, [{ info: row, color: MAP_THEME.selectedRegionOutline }], null, {
        field: sensor.format !== 'percent' ? field : undefined,
        domain: domainValues,
      });
      loading = false;
    });
  }
</script>

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
<td class="chart" class:loading>
  <Vega
    {data}
    spec={patchedSpec}
    signals={{ currentDate: $currentDateObject, highlightTimeValue }}
    signalListeners={['highlight']}
    on:signal={onHighlight}
    tooltip={VegaTooltip}
    tooltipProps={{ sensor }}
  />
</td>

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

  .date {
    display: block;
    font-size: 0.5em;

    letter-spacing: 0.025em;
    line-height: 1em;
    color: var(--red);
  }
</style>
