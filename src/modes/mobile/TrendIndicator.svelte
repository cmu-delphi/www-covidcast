<script>
  import Down from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-square-down.svg';
  import Up from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-square-up.svg';
  import Steady from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-square-right.svg';
  import Unknown from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/minus-square.svg';
  import { formatTrendChange } from '../../stores/trend';

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
  }
  .icon {
    color: #f0f1f3;
    margin-right: 0.25em;
    display: inline-flex;
  }
  .icon > :global(svg) {
    height: 1em;
    fill: currentColor;
  }
  .isGood {
    color: #27ae60;
  }
  .isBad {
    color: #eb5757;
  }
</style>

{#if long}
  <div class="trend-indicator">
    <span class="icon" class:isGood class:isBad>
      {@html trendIcon}
    </span>
    <span>
      {value}
      {#if trend != null}{trend.trend}{/if}
    </span>
  </div>
{:else}
  <div class="trend-indicator" class:isGood class:isBad>
    <span class="icon" class:isGood class:isBad>
      {@html trendIcon}
    </span>
    {value}
  </div>
{/if}
