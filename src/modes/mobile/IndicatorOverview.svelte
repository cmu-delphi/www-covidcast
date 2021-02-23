<script>
  import FancyHeader from './FancyHeader.svelte';
  import TrendIndicator from './TrendIndicator.svelte';

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;

  $: trend = region.fetchTrend(sensor.value, date.value);
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

TODO
<table class="indicator-table">
  <tr>
    <td>Last 7 day trend</td>
    <td class="indicator-table-value">
      {#await trend}
        <TrendIndicator trend={null} {sensor} />
      {:then d}
        <TrendIndicator trend={d} {sensor} />
      {/await}
    </td>
  </tr>
  <tr>
    <td>Last 7 day avg</td>
    <td class="indicator-table-value">
      {#await trend}N/A{:then d}{d && d.current ? sensor.value.formatValue(d.current.value) : 'N/A'}{/await}
    </td>
  </tr>
  <tr>
    <td>Record high</td>
    <td class="indicator-table-value">
      {#await trend}N/A{:then d}{d && d.max ? sensor.value.formatValue(d.max.value) : 'N/A'}{/await}
    </td>
  </tr>
</table>

{#if sensor.value.description}
  <FancyHeader>About this indicator</FancyHeader>

  <div class="desc">
    {@html sensor.value.description}
  </div>
{/if}
