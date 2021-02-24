<script>
  import Vega from '../../components/Vega.svelte';

  import { generateSparkLine } from '../../specs/lineSpec';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import SparkLineTooltip from './SparkLineTooltip.svelte';

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

  $: trend = region.fetchTrend(sensor.value, date.timeFrame, date.value);
  $: sparkline = region.fetchSparkLine(sensor.value, date.timeFrame, date.sparkLine);
  const spec = generateSparkLine({ highlightDate: true });

  $: unit = sensor.isPercentage ? '% of pop.' : sensor.isCasesOrDeath ? 'per 100k people' : '?';
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
</style>

<p>Over the <strong>last 7 days</strong> there have been</p>
<p />
<div class="mobile-two-col">
  <div>
    {#await trend}
      <TrendIndicator trend={null} long {sensor} />
    {:then d}
      <TrendIndicator trend={d} long {sensor} />
    {/await}
  </div>
  <div class="chart-50">
    <Vega
      {spec}
      data={sparkline}
      tooltip={SparkLineTooltip}
      tooltipProps={{ sensor: sensor.value }}
      signals={{ currentDate: date.value }} />
  </div>
  <div>
    <h3>Last 7 day average</h3>
    <div>
      {#await trend}
        N/A
      {:then d}
        <SurveyValue value={d && d.current ? d.current.value : null} factor={1} />
      {/await}
    </div>
    <div class="sub">{unit}</div>
  </div>
  <div>
    <h3>Record high</h3>
    <div>
      {#await trend}
        N/A
      {:then d}
        <SurveyValue value={d && d.max ? d.max.value : null} factor={1} />
      {/await}
    </div>
    <div class="sub">{unit}</div>
  </div>
</div>
