<script>
  import { formatFraction } from '../formats';
  /**
   * @type {import("../../stores/params").Trend}
   */
  export let trend;
</script>

{#if !trend || trend.isUnknown}
  ?
{:else if trend.isBetter}
  better by
  {formatFraction(trend.fractionChange)}
{:else if trend.isWorse}
  worse by
  {formatFraction(trend.fractionChange)}
{:else if trend.isNeutral}
  changed by
  {formatFraction(trend.fractionChange)}
{:else}around the same with {formatFraction(trend.fractionChange)}{/if}
