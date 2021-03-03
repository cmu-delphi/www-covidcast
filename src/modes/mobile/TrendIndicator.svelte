<script>
  import Down from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-down.svg';
  import Up from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-up.svg';
  import Steady from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-right.svg';
  import Unknown from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
  import SensorValue from './SensorValue.svelte';

  export let block = false;
  /**
   * @type {import("../../stores/params").Trend}
   */
  export let trend;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  export let long = false;

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
</script>

<style>
  .trend-indicator {
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    --color: #f0f1f3;
    --text: currentColor;
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
    margin-right: 0.5em;
  }
  .trend-value {
    font-size: 0.75rem;
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
  .isGood {
    --color: #27ae60;
    --text: white;
  }
  .isBad {
    --color: #eb5757;
    --text: white;
  }
</style>

<div
  class="trend-indicator"
  class:long
  class:short={!long}
  class:isGood={trend && trend.isGood}
  class:isBad={trend && trend.isBad}
  class:isSteady={trend && trend.isSteady}
  class:block>
  <span class="icon">
    {@html trendIcon}
  </span>
  {#if long && trend != null}<span class="trend-text"> {trend.trend} </span>{/if}
  <span class="trend-value">
    <SensorValue {sensor} value={trend ? trend.delta : null} enforceSign />
  </span>
</div>
