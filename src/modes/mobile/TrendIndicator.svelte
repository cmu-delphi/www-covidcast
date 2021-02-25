<script>
  import Down from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-down.svg';
  import Up from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-up.svg';
  import Steady from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-right.svg';
  import Unknown from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';

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

  $: value =
    trend && trend.delta != null && !Number.isNaN(trend.delta)
      ? `${trend.delta > 0 ? '+' : ''}${sensor.formatValue(trend.delta)}`
      : 'N/A';

  $: isGood = trend && ((trend.isIncreasing && sensor.isInverted) || (trend.isDecreasing && !sensor.isInverted));
  $: isBad = trend && ((trend.isIncreasing && !sensor.isInverted) || (trend.isDecreasing && sensor.isInverted));
  $: isSteady = trend && trend.isSteady;

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
    padding: 6px 10px;
    margin: 4px 1px;
    border-radius: 4px;
    background: var(--color);
    color: var(--text);
  }
  .block {
    display: flex;
  }
  .trend {
    font-weight: bold;
    margin-right: 0.5em;
  }
  .icon {
    margin-right: 0.25em;
    flex: 0 0 auto;
  }
  .icon > :global(svg) {
    width: 1.2em;
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

<div class="trend-indicator" class:long class:short={!long} class:isGood class:isBad class:isSteady class:block>
  <span class="icon">
    {@html trendIcon}
  </span>
  {#if long && trend != null}
    <span class="trend"> {trend.trend} </span>
    <span> ({value}) </span>
  {:else}<span>{value}</span>{/if}
</div>
