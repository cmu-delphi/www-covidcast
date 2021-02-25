<script>
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/Vega.svelte';
  import SparkLineTooltip from './SparkLineTooltip.svelte';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { currentMode } from '../../stores';
  import { modeByID } from '..';
  import TrendIndicator from './TrendIndicator.svelte';

  /**
   * @type {import("../../stores/params").SensorParam}
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

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").RegionParam} region
   */
  function loadSparkLine(sensor, date, region) {
    if (!region.value || !date.value) {
      return null;
    }
    return region.fetchSparkLine(sensor, date.timeFrame, date.sparkLine);
  }

  $: data = loadSparkLine(sensor, date, region);
  $: trend = region.fetchTrend(sensor, date.timeFrame, date);
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  $: spec = generateSparkLine({ highlightDate: true });

  function switchMode() {
    sensor.set(sensor.value);
    currentMode.set(modeByID.indicator);
  }
</script>

<style>
  .source {
    font-size: 10px;
  }

  .details-link {
    width: 6px;
    display: inline-block;
    fill: currentColor;
  }
</style>

<tr class="has-addon">
  <td>
    <a href="?mode=indicator&sensor={sensor.key}" class="uk-link-text" on:click|preventDefault={switchMode}>
      {sensor.value.name}
    </a>
  </td>
  <td>
    {#await trend}
      <TrendIndicator trend={null} {sensor} block />
    {:then d}
      <TrendIndicator trend={d} {sensor} block />
    {/await}
  </td>
  <td class="uk-text-right">
    {#await trend}?{:then t}{t && t.current ? sensor.formatValue(t.current.value) : 'N/A'}{/await}
  </td>
  <td rowspan="2">
    <div class="mobile-table-chart">
      <Vega
        {spec}
        {data}
        tooltip={SparkLineTooltip}
        tooltipProps={{ sensor: sensor.value }}
        signals={{ currentDate: date.value }} />
    </div>
  </td>
  <td rowspan="2">
    <a
      href="?mode=indicator&sensor={sensor.value.key}"
      class="uk-link-text details-link"
      on:click|preventDefault={switchMode}>
      {@html chevronRightIcon}
    </a>
  </td>
</tr>
<tr class="addon">
  <td colspan="3" class="source">Source: {sensor.value.id}</td>
</tr>
