<script>
  import Down from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-down.svg';
  import Up from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-up.svg';
  import Steady from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-right.svg';
  import Unknown from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
  import UiKitHint from '../../components/UIKitHint.svelte';

  /**
   * @type {import('./trend').Trend}
   */
  export let trend;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  export let long = false;

  let trendIcon = null;
  let isGood = false;
  let isBad = false;

  $: value =
    trend && trend.delta != null && !Number.isNaN(trend.delta)
      ? `${trend.delta > 0 ? '+' : ''}${sensor.formatValue(trend.delta)}`
      : 'N/A';

  $: {
    if (!trend || trend.isUnknown) {
      trendIcon = Unknown;
    } else if (trend.isIncreasing) {
      trendIcon = Up;
      isGood = sensor.isInverted;
      isBad = !sensor.isInverted;
    } else if (trend.isDecreasing) {
      trendIcon = Down;
      isGood = !sensor.isInverted;
      isBad = sensor.isInverted;
    } else {
      trendIcon = Steady;
      isGood = false;
      isBad = false;
    }
  }
</script>

<style>
  .trend-indicator {
    font-weight: 600;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
  }
  .icon {
    color: #f0f1f3;
    margin-right: 0.25em;
    flex: 0 0 auto;
  }
  .icon > :global(svg) {
    width: 1.2em;
    height: 1.2em;
    fill: currentColor;
  }
  .icon.long > :global(svg) {
    width: 2em;
    height: 2em;
  }
  .isGood {
    color: #27ae60;
  }
  .isBad {
    color: #eb5757;
  }
</style>

<div class="trend-indicator" class:isGood={long && isGood} class:isBad={long && isBad}>
  <span class="icon" class:isGood class:isBad class:long>
    {@html trendIcon}
  </span>
  <span>
    {#if long && trend != null}
      {trend.trend}
      ({value})

      <UiKitHint title={trend.trendReason} />
    {:else}{value}{/if}
  </span>
</div>
