<script>
  import Down from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-down.svg';
  import Up from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-up.svg';
  import Steady from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-right.svg';
  import Unknown from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
  import SensorValue from './SensorValue.svelte';
  import UiKitHint from '../../components/UIKitHint.svelte';
  import { formatDateShortWeekdayAbbr, formatFraction } from '../../formats';

  export let block = false;
  /**
   * @type {import("../../stores/trend").TrendInfo}
   */
  export let trend;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  export let long = false;
  export let explain = false;

  let trendIcon = null;
  $: {
    if (!trend || trend.isUnknown) {
      trendIcon = Unknown;
    } else if (trend.isIncreasing) {
      trendIcon = Up;
    } else if (trend.isDecreasing) {
      trendIcon = Down;
    } else {
      trendIcon = Steady;
    }
  }

  /**
   * @type {import("../../stores/params").Trend}
   */
  function trendExplaination(trend) {
    if (!trend || trend.isUnknown) {
      return 'Historical trend is unknown';
    }
    const reason = `The value on ${formatDateShortWeekdayAbbr(trend.currentDate)} (${sensor.formatValue(
      trend.current.value,
    )}) has changed Δ ${formatFraction(trend.change, true)} compared to ${formatDateShortWeekdayAbbr(
      trend.refDate,
    )} (${sensor.formatValue(trend.ref.value)}), which is classified as: <br/><br/> ${trend.trendReason}`;

    if (trend.isSteady) {
      return `Historical trend remains consistent: <br/> ${reason}`;
    }
    return `Historical trend is ${trend.trend}: <br/> ${reason}`;
  }
</script>

<style>
  .trend-indicator {
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    --color: #f0f1f3;
    --text: currentColor;
    font-size: 0.75rem;
  }
  .long {
    font-size: 0.875rem;
    text-transform: uppercase;
    padding: 6px 6px;
    margin: 4px 0;
    border-radius: 4px;
    background: var(--color);
    color: var(--text);
  }
  .block {
    display: flex;
  }
  .trend-text {
    flex-grow: 1;
    margin-right: 0.5em;
  }
  .trend-value {
    font-weight: 700;
  }
  .icon {
    margin-right: 0.25em;
    flex: 0 0 auto;
  }
  .icon > :global(svg) {
    width: 0.85em;
    fill: currentColor;
  }
  .short > .icon {
    color: var(--color);
  }
  .isSteady {
    --color: #2f80ed;
    --text: white;
  }
  .isBetter {
    --color: #27ae60;
    --text: white;
  }
  .isWorse {
    --color: #eb5757;
    --text: white;
  }
</style>

<div
  class="trend-indicator"
  class:long
  class:short={!long}
  class:isBetter={trend && trend.isBetter}
  class:isWorse={trend && trend.isWorse}
  class:isSteady={trend && trend.isSteady}
  class:block>
  <span class="icon">
    {@html trendIcon}
  </span>
  {#if long}
    <span class="trend-text"> {trend != null ? trend.trend : 'Unknown'} </span>
    {#if trend != null && !trend.isUnknown}
      <span class="trend-value">
        <SensorValue {sensor} value={trend.delta} enforceSign />
      </span>
    {/if}
  {:else}
    <span class="trend-value">
      <SensorValue {sensor} value={trend ? trend.delta : null} enforceSign />
    </span>
  {/if}
  {#if explain}
    <UiKitHint title={trendExplaination(trend)} />
  {/if}
</div>
