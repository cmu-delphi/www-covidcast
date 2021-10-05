<script>
  import Vega from '../components/vega/Vega.svelte';
  import { formatDateShortNumbers } from '../formats';
  import { generateSparkLine } from '../specs/lineSpec';
  import KPIValue from '../components/KPIValue.svelte';
  import SensorUnit from '../components/SensorUnit.svelte';
  import SparkLineTooltip from '../components/SparkLineTooltip.svelte';
  import KPIChange from '../components/KPIChange.svelte';

  /**
   * @type {import('../../stores/constants').Sensor}
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
   * @type {import("../../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  $: trend = fetcher.fetch1Sensor1Region1DateTrend(sensor, region, date);
  $: sparkline = fetcher.fetch1Sensor1RegionSparkline(sensor, region, date);
  $: spec = generateSparkLine({
    domain: date.sparkLineTimeFrame.domain,
    highlightDate: 'top',
    highlightStartEnd: false,
  });
</script>

<div class="mobile-three-col">
  <div class="mobile-kpi">
    <div>
      {#await trend}
        <KPIValue value={null} loading />
      {:then d}
        <KPIValue value={d ? d.value : null} digits={sensor.isPercentage ? 2 : 1} />
      {/await}
    </div>
    <div class="sub">
      <SensorUnit {sensor} long />
    </div>
  </div>
  <div class="mobile-kpi">
    <div>
      {#await trend}
        <KPIChange value={null} loading />
      {:then d}
        <KPIChange value={d ? d.change : null} />
      {/await}
    </div>
    <div class="sub">Relative change to 7 days ago</div>
  </div>
  <div>
    <div class="chart-50">
      <Vega
        {spec}
        data={sparkline}
        tooltip={SparkLineTooltip}
        tooltipProps={{ sensor: sensor }}
        signals={{ currentDate: date.value }}
      />
    </div>
    <div class="date-range">
      <span> {formatDateShortNumbers(date.sparkLineTimeFrame.min)} </span>
      <span> {formatDateShortNumbers(date.sparkLineTimeFrame.max)} </span>
    </div>
  </div>
</div>

<style>
  .date-range {
    padding: 0 2px;
    display: flex;
    justify-content: space-between;
    line-height: 1;
    font-size: 0.75rem;
  }
  .date-range > span {
    position: relative;
    padding: 0 2px;
  }
  .date-range > span::before {
    content: '';
    position: absolute;
    left: 0;
    top: -3px;
    height: 4px;
    background: black;
    width: 1px;
  }

  .date-range > span:last-of-type::before {
    left: unset;
    right: 0;
  }
</style>
