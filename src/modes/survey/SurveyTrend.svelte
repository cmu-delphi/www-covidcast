<script>
  import questionCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/regular/question-circle.svg';
  import longArrowDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/long-arrow-alt-down.svg';
  import longArrowRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/long-arrow-alt-right.svg';
  import longArrowUpIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/long-arrow-alt-up.svg';
  import UiKitHint from '../../components/UIKitHint.svelte';
  import { formatDateShortAbbr } from '../../formats';
  import { formatTrendChange, formatValue } from './format';
  /**
   * @type {import('./trend').Trend}
   */
  export let trend = null;

  export let inverted = false;

  let trendIcon = null;
  let trendInfo = '';
  let isGood = false;
  let isBad = false;

  /**
   * @param {import('./trend').Trend} trend
   */
  function trendExplaination(trend) {
    return `The value on ${formatDateShortAbbr(trend.current.date_value)} (${formatValue(
      trend.current.value,
    )}) has changed ${formatTrendChange(trend.change)} compared to ${formatDateShortAbbr(trend.refDate)} (${formatValue(
      trend.ref.value,
    )}), which is classified as: ${trend.trendReason}`;
  }

  $: {
    if (!trend || trend.trend === 'Unknown') {
      trendIcon = questionCircleIcon;
      trendInfo = 'Historical trend is unknown';
    } else if (trend.trend.startsWith('inc')) {
      trendIcon = longArrowUpIcon;
      trendInfo = `Historical trend is ${trend.trend}: ${trendExplaination(trend)}`;
      isGood = inverted;
      isBad = !inverted;
    } else if (trend.trend.startsWith('dec')) {
      trendIcon = longArrowDownIcon;
      trendInfo = `Historical trend is ${trend.trend}: ${trendExplaination(trend)}`;
      isGood = !inverted;
      isBad = inverted;
    } else {
      trendIcon = longArrowRightIcon;
      trendInfo = `Historical trend remains consistent: ${trendExplaination(trend)}`;
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
  {trend ? trend.trend : null}
  <UiKitHint title={trendInfo} />
</div>
