<script>
  import Down from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-square-down.svg';
  import Up from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-square-up.svg';
  import Steady from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-square-right.svg';
  import Unknown from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/minus-square.svg';
  import { formatTrendChange } from '../../stores/trend';
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

  $: value = formatTrendChange(trend ? trend.change : null, true);

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
    {value}
    {#if long && trend != null}
      {trend.trend}
      <UiKitHint title={trend.trendReason} />
    {/if}
  </span>
</div>
