<script>
  import IndicatorCorrelationChart from './IndicatorCorrelationChart.svelte';
  import HistoryLineChart from './HistoryLineChart.svelte';
  import Vega from '../../components/Vega.svelte';

  import { currentRegionInfo, currentSensorEntry, currentDateObject, isMobileDevice, times } from '../../stores';
  import { DateParam, RegionParam, DataFetcher } from '../../stores/params'; // DataFetcher

  import { generateCorrelationMetrics } from '../../data/utils.js';

  $: chartPadding = $isMobileDevice
    ? { left: 20, right: 10, top: 10, bottom: 40 }
    : { left: 20, right: 50, top: 20, bottom: 15 };
  $: sizeLegend = $isMobileDevice
    ? { orient: 'bottom', direction: 'horizontal', title: '' }
    : {
        orient: 'top',
        direction: 'horizontal',
        symbolType: 'square',
        symbolStrokeWidth: 2,
        title: ' ',
      };

  $: mainChartOptions = {
    title: `${secondary.name} correlated with ${primary.name} lagged by ${sensorDetailsLag} days`,
    width: 400,
    height: 400,
    padding: chartPadding,
    sizeLegend,
    showTooltips: true,
    showRSquared: true,
  };
  $: sliderChartOptions = {
    width: 50,
    height: 50,
    padding: { top: 12, left: 0, right: 0 },
    sizeLegend: null,
    axisTitles: false,
    ticks: false,
    tickLabels: false,
    showTooltips: false,
    showRSquared: true,
  };

  $: date = new DateParam($currentDateObject, $currentSensorEntry, $times);
  $: region = new RegionParam($currentRegionInfo);

  /**
   * @type {import("../../stores/params").Sensor}
   */
  export let primary;
  /**
   * @type {import("../../stores/params").Sensor}
   */
  export let secondary;
  /**
   * @type {import("../../stores/params").EpiDataRow[]}
   */
  export let primaryData;
  /**
   * @type {import("../../stores/params").EpiDataRow[]}
   */
  export let secondaryData;

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(primary, region, date);
  }

  let sensorListData = [
    { sensor: primary, data: primaryData },
    { sensor: secondary, data: secondaryData },
  ];

  $: sensorCorrelationData = mergeSensors();
  // for each time_value, merge data values across sensors.
  function mergeSensors() {
    const sensorDateMap = {};
    const sensorKeysMap = {}; // map from sensor key to sensor.
    sensorListData.map((sensorAndData) => {
      const { sensor, data } = sensorAndData;
      data.forEach((row) => {
        const time_value_key = String(row.time_value);
        if (!sensorDateMap[time_value_key]) {
          sensorDateMap[time_value_key] = { ...row };
        }
        const sensorKey = sensor.key;
        sensorKeysMap[sensorKey] = sensor;
        sensorDateMap[time_value_key][sensorKey] = row.value;
      });
    });
    return Object.values(sensorDateMap);
  }
  $: sensorDetailsLag = 0;
  // Compute dates for primary and secondary data, adjusted by lag.
  // But using these isn't adjusting the range of data displayed in each indicator chart.
  // $: lagMS = sensorDetailsLag * 1000 * 3600 * 24;
  // $: primarytDate = new DateParam(new Date($currentDateObject.getTime() - lagMS), $currentSensorEntry, $times);
  // $: secondaryDate = new DateParam(new Date($currentDateObject.getTime() + lagMS), $currentSensorEntry, $times);
  console.info(primaryData, secondaryData);
  const lagVsR2 = generateCorrelationMetrics(primaryData, secondaryData).lags;
  const lagVsR2Spec = {
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

<div class="mobile-root">
  <IndicatorCorrelationChart
    {sensorCorrelationData}
    {primary}
    {secondary}
    lag={sensorDetailsLag}
    options={mainChartOptions} />

  <input
    type="range"
    min="-28"
    max="28"
    step="1"
    value={sensorDetailsLag}
    on:mousemove={(e) => {
      sensorDetailsLag = e.target.value;
    }}
    on:click={(e) => {
      sensorDetailsLag = e.target.value;
    }}
    style="width:450px;  margin-left: 35px" />

  <div style="width: 100%">
    <Vega data={lagVsR2} spec={lagVsR2Spec} />
  </div>

  <br />

  <div class="uk-container content-grid">
    <div class="chart-300">
      <HistoryLineChart sensor={primary} {date} {region} {fetcher} />
    </div>
    <div class="chart-300">
      <HistoryLineChart sensor={secondary} {date} {region} {fetcher} />
    </div>
  </div>
</div>
