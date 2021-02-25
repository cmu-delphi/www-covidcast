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
  /**
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  $: minMax = fetcher.fetchGlobalMinMax(sensor, region);
  $: trend = fetcher.fetchWindowTrend(sensor, region, date);
  $: sparkline = fetcher.fetchSparkLine(sensor, region, date);
  $: spec = generateSparkLine({ highlightDate: true, domain: date.sparkLineTimeFrame.domain });

  $: unit = sensor.isPercentage ? '% of pop.' : sensor.isCasesOrDeath ? 'per 100k people' : '?';
</script>

<p>Over the <strong>last 7 days</strong> there have been</p>

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
    {#if sensor.isInverted}
      <h3>Record low</h3>
      <div>
        {#await minMax}
          N/A
        {:then d}
          <SurveyValue value={d && d.min ? d.min.value : null} factor={1} />
        {/await}
      </div>
    {:else}
      <h3>Record high</h3>
      <div>
        {#await minMax}
          N/A
        {:then d}
          <SurveyValue value={d && d.max ? d.max.value : null} factor={1} />
        {/await}
      </div>
    {/if}
    <div class="sub">{unit}</div>
  </div>
</div>
