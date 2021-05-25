<script>
  import UIKitHint from '../components/UIKitHint.svelte';
  import { formatDateYearDayOfWeekAbbr } from '../formats';
  import { stats } from '../stores';
  import { determineStatsInfo } from '../stores/stats';
  /**
   * @type {import('../stores/params').Sensor}
   */
  export let sensor;

  /**
   * @type {import('../stores/params').RegionLevel}
   */
  export let level = 'nation';

  export let suffix = '';

  $: info = determineStatsInfo($stats, sensor, level);
</script>

{#if info}
  <UIKitHint
    title="Most recent available date:<br>&nbsp;{formatDateYearDayOfWeekAbbr(
      info.maxTime,
    )}<br>Last update on:<br>&nbsp;{formatDateYearDayOfWeekAbbr(info.maxIssue)}"
    noMargin={suffix.length > 0}
    inline={suffix.length === 0}
  />
{/if}
{suffix}
