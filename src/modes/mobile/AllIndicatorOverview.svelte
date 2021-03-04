<script>
  import FancyHeader from './FancyHeader.svelte';
  import { sensorList } from '../../stores';
  import { isInverted } from '../../stores/params';
  import { formatDateShortWeekdayAbbr } from '../../formats';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  /**
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").Region[]} region
   */
  function generateTrendSummary(date, region) {
    if (!date.value || !region.value) {
      return Promise.resolve(null);
    }
    return Promise.all(sensorList.map((sensor) => fetcher.fetchWindowTrend(sensor, region, date))).then((trends) => {
      const positive = [];
      const negative = [];
      const unknown = [];
      trends.forEach((trend, i) => {
        const inv = isInverted(sensorList[i]);
        if (trend.isIncreasing) {
          (!inv ? negative : positive).push(sensorList[i]);
        } else if (trend.isDecreasing) {
          (inv ? negative : positive).push(sensorList[i]);
        } else {
          unknown.push(sensorList[i]);
        }
      });
      return { positive, negative, unknown };
    });
  }

  $: trendSummary = generateTrendSummary(date, region);

  function worse(worse) {
    if (!worse) {
      return 'N/A are getting worse.';
    }
    if (worse.length === 0) {
      return 'None are getting worse.';
    }
    if (worse.length === 1) {
      return `"${worse[0].name}" is getting worse.`;
    }
    return `${worse
      .slice(0, worse.length - 1)
      .map((d) => `"${d.name}"`)
      .join(', ')}, and "${worse[worse.length - 1].name}" are getting worse.`;
  }
</script>

<FancyHeader sub="Overall" />

<p>
  {#await trendSummary}
    <strong>N/A of {sensorList.length} indicators</strong>
    are
    <strong>getting better.</strong>
    {worse(null)}
  {:then d}
    <strong>{d ? d.positive.length : 'N/A'} of {sensorList.length} indicators</strong>
    are
    <strong>getting better.</strong>
    {worse(d ? d.negative : null)}
    {#if d && d.unknown.length > 0}
      <strong>{d ? d.unknown.length : 'N/A'} of {sensorList.length} indicators</strong>
      are
      <strong>not available</strong>
      for
      {formatDateShortWeekdayAbbr(date.value)}.
    {/if}
  {/await}
</p>
