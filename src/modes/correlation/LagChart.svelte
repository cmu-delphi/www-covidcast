<script>
  import Vega from '../../components/Vega.svelte';
  import { generateCorrelationMetrics } from '../../data/utils';
  import { genCreditsLayer } from '../../specs/lineSpec';

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

  $: spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    autosize: {
      type: 'none',
      contains: 'padding',
      resize: true,
    },
    width: 500,
    height: 100,
    padding: { top: 42, left: 42, bottom: 55, right: 15 },
    data: { name: 'values' },
    title: {
      text: `R² between ${primary.name} and ${secondary.name} per Lag`,
      align: 'left',
      anchor: 'start',
    },
    layer: [
      {
        mark: 'line',
        encoding: {
          x: {
            field: 'lag',
            type: 'quantitative',
            axis: {
              title: 'Lag',
              titleFontWeight: 'normal',
              labelFontSize: 14,
              labelOverlap: true,
            },
          },
          y: {
            field: 'r2',
            type: 'quantitative',
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
      genCreditsLayer(),
    ],
  };

  // TODO interactive lag selection
</script>

<div class="chart-150">
  <Vega {data} {spec} />
</div>
