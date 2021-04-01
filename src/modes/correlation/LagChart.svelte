<script>
  import Vega from '../../components/Vega.svelte';
  import { generateCorrelationMetrics } from '../../data/utils';

  /**
   * @typedef {import('../../stores/constants').SensorEntry} SensorEntry
   */

  /**
   * @typedef {import("../../src/data/util").CorrelationMetric} CorrelationMetric
   */

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

  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    // autosize: 'fit',
    padding: { left: 20, bottom: 25, right: 10 },
    height: 50,
    width: 420,
    data: { name: 'values' },
    mark: 'line',
    encoding: {
      x: {
        field: 'lag',
        type: 'quantitative',
      },
      y: {
        field: 'r2',
        type: 'quantitative',
      },
    },
  };
</script>

<Vega {data} {spec} />
