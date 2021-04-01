<script>
  import Vega from '../../components/Vega.svelte';
  import { generateCorrelationMetrics } from '../../data/utils';
  import { BASE_SPEC, guessTopPadding, joinTitle } from '../../specs/commonSpec';
  import { genCreditsLayer } from '../../specs/lineSpec';
  import { isMobileDevice } from '../../stores';
  import Toggle from '../mobile/Toggle.svelte';
  import WarningBanner from '../mobile/components/WarningBanner.svelte';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let primary;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let secondary;
  /**
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  function loadData(primary, secondary, region, date) {
    if (!secondary) {
      return Promise.resolve([]);
    }
    const primaryData = fetcher.fetch1Sensor1RegionNDates(primary, region, date.windowTimeFrame);
    const secondaryData = fetcher.fetch1Sensor1RegionNDates(secondary, region, date.windowTimeFrame);
    return Promise.all([primaryData, secondaryData]).then((r) => {
      return generateCorrelationMetrics(r[0], r[1]).lags;
    });
  }

  $: data = loadData(primary, secondary, region, date);

  function generateSpec({ title, subTitle, zero } = {}) {
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      ...BASE_SPEC,
      width: 500,
      height: 100,
      padding: { top: guessTopPadding(title, subTitle), left: 42, bottom: 45, right: 8 },
      title: {
        text: title,
        subtitle: subTitle,
      },
      layer: [
        {
          mark: 'line',
          encoding: {
            x: {
              field: 'lag',
              type: 'quantitative',
              scale: {
                nice: false,
              },
              axis: {
                title: 'Lag (days)',
                labelOverlap: true,
              },
            },
            y: {
              field: 'r2',
              type: 'quantitative',
              scale: {
                zero,
              },
              axis: {
                grid: true,
                title: null,
                domain: false,
                tickCount: 5,
                labelFontSize: 14,
              },
            },
          },
        },
        genCreditsLayer({ shift: 45 }),
      ],
    };
    return spec;
  }

  let scaled = false;
  $: spec = generateSpec({
    zero: !scaled,
    title: joinTitle([`R² between "${primary.name}" and `, `"${secondary.name}" per Lag`], $isMobileDevice),
  });
  // TODO interactive lag selection
</script>

{#await data}
  <!-- dummy -->
{:catch error}
  <WarningBanner>
    {error.message}
  </WarningBanner>
{/await}

<div class="chart-150">
  <Vega {data} {spec} />
</div>
<div class="buttons">
  <Toggle bind:checked={scaled}>Rescale Y-axis</Toggle>
  <div class="spacer" />
</div>

<style>
  .buttons {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .spacer {
    flex: 1 1 0;
  }
</style>
