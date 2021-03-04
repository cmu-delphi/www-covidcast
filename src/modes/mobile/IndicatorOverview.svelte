<script>
  import Vega from '../../components/Vega.svelte';
  import { formatDateShortNumbers, formatDateShortWeekdayAbbr, formatDateYearWeekdayAbbr } from '../../formats';
  import { generateSparkLine } from '../../specs/lineSpec';
  import { WINDOW_SIZE } from '../../stores/params';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import SensorUnit from './SensorUnit.svelte';
  import SensorValue from './SensorValue.svelte';
  import SparkLineTooltip from './SparkLineTooltip.svelte';

  import TrendIndicator from './TrendIndicator.svelte';
  import TrendText from './TrendText.svelte';

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

  $: trend = fetcher.fetchWindowTrend(sensor, region, date);
  $: sparkline = fetcher.fetchSparkLine(sensor, region, date);
  $: spec = generateSparkLine({
    domain: date.sparkLineTimeFrame.domain,
    highlightDate: 'top',
    highlightStartEnd: false,
  });
</script>

<style>
  p {
    margin: 1em 0;
  }

  .date-range {
    padding: 0 2px;
    display: flex;
    justify-content: space-between;
    line-height: 1;
    font-size: 0.75rem;
  }
</style>

<p>On {formatDateShortWeekdayAbbr(date.value, true)} the number of people:</p>

<div class="mobile-two-col">
  <div class="mobile-kpi">
    <div>
      {#await trend}
        N/A
      {:then d}
        <SurveyValue value={d && d.current ? d.current.value : null} digits={sensor.isPercentage ? 2 : 1} />
      {/await}
    </div>
    <div class="sub">
      <SensorUnit {sensor} long />
    </div>
  </div>
  <div>
    <div class="chart-50">
      <Vega
        {spec}
        data={sparkline}
        tooltip={SparkLineTooltip}
        tooltipProps={{ sensor: sensor }}
        signals={{ currentDate: date.value }} />
    </div>
    <div class="date-range">
      <span> {formatDateShortNumbers(date.sparkLineTimeFrame.min)} </span>
      <span> {formatDateShortNumbers(date.sparkLineTimeFrame.max)} </span>
    </div>
  </div>
</div>

<p>Compared to the previous week that means:</p>

<div>
  {#await trend}
    <TrendIndicator trend={null} long {sensor} />
  {:then d}
    <TrendIndicator trend={d} long {sensor} />
  {/await}
</div>

<p>
  {#await trend then d}
    {#if +date.value === +d.worstDate}
      On
      {formatDateShortWeekdayAbbr(date.value, true)}
      <strong>{sensor.value.name}</strong>
      was the
      {WINDOW_SIZE}
      month
      <strong>worst</strong>
      value compared to
      <strong>best value of
        <SensorValue {sensor} value={d.best ? d.best.value : null} /></strong>
      on
      <strong>{formatDateYearWeekdayAbbr(d.bestDate, true)}</strong>.
    {:else}
      On
      {formatDateShortWeekdayAbbr(date.value, true)}
      <strong>{sensor.value.name}</strong>
      was
      <strong>
        <TrendText {sensor} trend={d.worstTrend} />
      </strong>
      compared to the
      <strong>{WINDOW_SIZE}
        month worst value of
        <SensorValue {sensor} value={d.worst ? d.worst.value : null} /></strong>
      on
      <strong>{formatDateYearWeekdayAbbr(d.worstDate, true)}</strong>.
    {/if}
  {/await}
</p>
