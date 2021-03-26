<script>
  import IndicatorCorrelationChart from './IndicatorCorrelationChart.svelte';

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
    // console.info('sensorDateMap', sensorDateMap);
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
    options={{ title: `${secondary.name} correlated with ${primary.name} lagged by ${sensorDetailsLag} days`, width: 400, height: 400, padding: { top: 20, left: 20, bottom: 20, right: 50 }, sizeLegend: true, showTooltips: true, showRSquared: true }} />

  <table>
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
          style="width: 500px;" />
        <table style="width: 500px; height: 50px">
          <tr>
            {#each [-28, -21, -14, -7, 0, 7, 14, 21, 28] as lag}
              <td style="width: 50px; height: 50px">
                <IndicatorCorrelationChart
                  {sensorCorrelationData}
                  {primary}
                  {secondary}
                  {lag}
                  on:click={() => (sensorDetailsLag = lag)}
                  options={{ width: 50, height: 50, padding: { top: 12, left: 0, right: 0 }, sizeLegend: false, axisTitles: false, ticks: false, tickLabels: false, showTooltips: false, showRSquared: true }} />
              </td>
            {/each}
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
