<script>
  import Down from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-square-down.svg';
  import Up from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-square-up.svg';
  import Steady from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/square.svg';
  import Unknown from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/minus-square.svg';
  import { formatPercentage } from '../../formats';

  /**
   * @type {number}
   */
  export let trend = null;
  export let trendClass = 'steady';
  export let inverted = false;
  export let long = false;

  let trendIcon = null;
  let isGood = false;
  let isBad = false;

  $: value = formatPercentage(trend);

  $: {
    if (trend == null || !trendClass) {
      trendIcon = Unknown;
    } else if (trendClass.startsWith('inc')) {
      trendIcon = Up;
      isGood = inverted;
      isBad = !inverted;
    } else if (trendClass.startsWith('dec')) {
      trendIcon = Down;
      isGood = !inverted;
      isBad = inverted;
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
  }
  .icon {
    color: #f0f1f3;
    margin-right: 0.5em;
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
    {value}
    {#if trend != null}{trendClass}{/if}
  </div>
{:else}
  <div class="trend-indicator" class:isGood class:isBad>
    <span class="icon">
      {@html trendIcon}
    </span>
    {value}
  </div>
{/if}
