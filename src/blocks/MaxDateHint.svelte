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
   * @type {import("../../stores/params").DateParam | null}
   */
  export let date = null;
  /**
   * @type {import("../../stores/params").RegionParam | null}
   */
  export let region = null;
  /**
   * @type {import("../../stores/DataFetcher").DataFetcher | null}
   */
  export let fetcher = null;

  let maxTime;
  $: info = $metaDataManager.getMetaData(sensor);

  function updateMaxTime(fetcher, sensor, region, date) {
    if (date.sparkLineTimeFrame.max <= maxTime) {
      return;
    }
    const sparkline = fetcher.fetch1Sensor1RegionSparkline(sensor, region, date);
    // use sparkline data to find the "real" max time
    sparkline.then((data) => {
      const maxDate = data.reduce((acc, v) => (v.date_value > acc ? v.date_value : acc), maxTime);
      if (maxDate > maxTime) {
        maxTime = maxDate;
      }
    });
  }
  $: {
    maxTime = info.maxTime;
    if (fetcher && region && date) {
      updateMaxTime(fetcher, sensor, region, date);
    }
  }
</script>

{#if info}
  <UIKitHint
    title="Most recent available date:<br>&nbsp;{formatDateYearDayOfWeekAbbr(
      maxTime,
    )}<br>Last update on:<br>&nbsp;{formatDateYearDayOfWeekAbbr(info.maxIssue)}"
    noMargin={suffix.length > 0}
    inline={suffix.length === 0}
  />
{/if}
{suffix}
