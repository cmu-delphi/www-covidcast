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
      const unknownOrNeutral = [];
      trends.forEach((trend, i) => {
        const sensor = sensorList[i];
        if (trend.isBetter) {
          positive.push(sensor);
        } else if (trend.isWorse) {
          negative.push(sensor);
        } else {
          unknownOrNeutral.push(sensor);
        }
      });
      return { positive, negative, unknownOrNeutral };
    });
  }

  $: trendSummary = generateTrendSummary(date, region);
</script>

<FancyHeader sub="Summary" anchor="indicators">Indicators</FancyHeader>

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
    {#if d && d.unknownOrNeutral.length > 0}
      <strong>{d.unknownOrNeutral.length} of {sensorList.length} indicators</strong>
      are
      <strong>have changed</strong> or are <strong>not available</strong>
      for
      {formatDateYearWeekdayAbbr(date.value)}.
    {/if}
  {/await}
</p>
