<script>
  import FancyHeader from './FancyHeader.svelte';
  import { sensorList } from '../../stores';
  import { formatDateYearWeekdayAbbr } from '../../formats';
  import AllIndicatorsText from './AllIndicatorsText.svelte';

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
        const inv = sensorList[i].isInverted;
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
</script>

<FancyHeader sub="Summary">Indicators</FancyHeader>

<p>
  {#await trendSummary}
    <strong>N/A of {sensorList.length} indicators</strong>
    are
    <strong>getting better.</strong>
    <AllIndicatorsText sensors={null} />
  {:then d}
    <strong>{d ? d.positive.length : 'N/A'} of {sensorList.length} indicators</strong>
    are
    <strong>getting better.</strong>
    <AllIndicatorsText sensors={d ? d.negative : null} />
    {#if d && d.unknown.length > 0}
      <strong>{d ? d.unknown.length : 'N/A'} of {sensorList.length} indicators</strong>
      are
      <strong>not available</strong>
      for
      {formatDateYearWeekdayAbbr(date.value)}.
    {/if}
  {/await}
</p>
