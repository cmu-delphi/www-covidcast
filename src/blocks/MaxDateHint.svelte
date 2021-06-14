<script>
  import UIKitHint from '../components/UIKitHint.svelte';
  import { formatDateYearDayOfWeekAbbr } from '../formats';
  import { metaDataManager } from '../stores';
  /**
   * @type {import('../stores/params').Sensor}
   */
  export let sensor;

  export let suffix = '';

  $: info = $metaDataManager.getMetaData(sensor);
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
