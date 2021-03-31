<script>
  import IndicatorCorrelationChart from './IndicatorCorrelationChart.svelte';
  import HistoryLineChart from './HistoryLineChart.svelte';

  import { currentRegionInfo, currentSensorEntry, currentDateObject, isMobileDevice, times } from '../../stores';
  import { DateParam, RegionParam, DataFetcher } from '../../stores/params'; // DataFetcher

  $: sliderLags = $isMobileDevice ? [-28, -14, 0, 14, 28] : [-28, -21, -14, -7, 0, 7, 14, 21, 28];
  $: chartPadding = $isMobileDevice
    ? { left: 20, right: 10, top: 10, bottom: 40 }
    : { left: 20, right: 50, top: 20, bottom: 15 };
  $: sizeLegend = $isMobileDevice
    ? { orient: 'bottom', direction: 'horizontal', title: '' }
    : {
        orient: 'right',
        direction: 'vertical',
        symbolType: 'square',
        symbolStrokeWidth: 2,
        title: 'Date',
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
</script>

<div>
  <IndicatorCorrelationChart
    {sensorCorrelationData}
    {primary}
    {secondary}
    lag={sensorDetailsLag}
    options={mainChartOptions} />

  <table class="mobile-table">
    <tr>
      <td>Lag:</td>
      <td>
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
          style="width: 100%;" />
        <table class="mobile-table" style="width: 100%; height: 50px">
          <tr>
            {#each sliderLags as lag}
              <td style="width: 50px; height: 50px">
                <IndicatorCorrelationChart
                  {sensorCorrelationData}
                  {primary}
                  {secondary}
                  {lag}
                  on:click={() => (sensorDetailsLag = lag)}
                  options={sliderChartOptions} />
              </td>
            {/each}
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <div class="chart-300">
    <HistoryLineChart sensor={primary} {date} {region} {fetcher} />
  </div>
  <div class="chart-300">
    <HistoryLineChart sensor={secondary} {date} {region} {fetcher} />
  </div>
</div>
