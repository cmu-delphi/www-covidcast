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
</script>

<div>
  {primary.name}
  ({primaryData.length}) -
  {secondary.name}
  ({secondaryData.length})

  <IndicatorCorrelationChart
    {sensorCorrelationData}
    sensor={secondary}
    lag="0"
    options={{ width: 400, height: 400, sizeLegend: true, showTooltips: true, showRSquared: true }} />
</div>
