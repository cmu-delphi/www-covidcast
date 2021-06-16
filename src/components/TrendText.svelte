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
  {formatFraction(trend.change)}
{:else if trend.isWorse}
  worse by
  {formatFraction(trend.change)}
{:else if trend.isNeutral}
  changed by
  {formatFraction(trend.change)}
{:else}around the same with {formatFraction(trend.change)}{/if}
