<script>
  import UIKitHint from '../components/UIKitHint.svelte';
  import { formatDateYearDayOfWeekAbbr } from '../formats';
  import { metaDataManager } from '../stores';
  /**
   * @type {import('../stores/params').Sensor}
   */
  export let sensor;

  export let suffix = '';

  /**
   * @type {import("../../stores/DataFetcher").DataFetcher | null}
   */
  export let fetcher = null;

  $: info = $metaDataManager.getMetaData(sensor);
  $: maxTimeAndIssue = fetcher
    ? fetcher.fetch1SensorMaxDateAndIssue(sensor, $metaDataManager)
    : info
    ? Promise.resolve(info)
    : null;
</script>

{#if info}
  {#await maxTimeAndIssue then t}
    <UIKitHint
      title="Most recent available date:<br>&nbsp;{formatDateYearDayOfWeekAbbr(
        t.maxTime,
      )}<br>Last update on:<br>&nbsp;{formatDateYearDayOfWeekAbbr(t.maxIssue)}"
      noMargin={suffix.length > 0}
      inline={suffix.length === 0}
    />
  {/await}
{/if}
{suffix}
