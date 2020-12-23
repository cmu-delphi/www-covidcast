<script>
  import questionCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/regular/question-circle.svg';
  import longArrowDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/long-arrow-alt-down.svg';
  import longArrowRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/long-arrow-alt-right.svg';
  import longArrowUpIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/long-arrow-alt-up.svg';
  import UiKitHint from '../../components/UIKitHint.svelte';
  /**
   * @type {string}
   */
  export let trend = null;

  export let inverted = false;

  let trendIcon = null;
  let trendInfo = '';
  let isGood = false;
  let isBad = false;
  $: {
    if (!trend) {
      trendIcon = questionCircleIcon;
      trendInfo = 'Historcal trend remains consistent';
    } else if (trend.startsWith('inc')) {
      trendIcon = longArrowUpIcon;
      trendInfo = `Historcal trend is ${trend}`;
      isGood = inverted;
      isBad = !inverted;
    } else if (trend.startsWith('dec')) {
      trendIcon = longArrowDownIcon;
      trendInfo = `Historcal trend is ${trend}`;
      isGood = inverted;
      isBad = !inverted;
    } else {
      trendIcon = longArrowRightIcon;
      trendInfo = 'Historcal trend remains consistent';
    }
  }
</script>

<style>
  .root {
    background: #f0f1f3;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 12px;
    letter-spacing: 0.75px;
    text-transform: uppercase;
    font-size: 0.9rem;
    border-radius: 3px;
    align-self: center;
  }
  .isGood {
    background: #27ae60;
    color: white;
  }
  .isBad {
    background: #eb5757;
    color: white;
  }
</style>

<div class="root" class:isGood class:isBad>
  <span class="inline-svg-icon">
    {@html trendIcon}
  </span>
  {trend}
  <UiKitHint title={trendInfo} />
</div>
