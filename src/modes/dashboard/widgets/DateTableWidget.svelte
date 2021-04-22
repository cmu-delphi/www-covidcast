<script>
  import { getContext } from 'svelte';
  import { formatDateISO } from '../../../formats';
  import { determineTrends } from '../../../stores/trend';
  import ATableWidget, { toRow } from './ATableWidget.svelte';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").TimeFrame}
   */
  export let timeFrame;
  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  /**
   * @type {import("../../../stores/params").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").RegionParam} region
   * @param {import("../../../stores/params").TineFrame} timeFrame
   * @returns {Promise<TableRows[]>}
   */
  function loadData(sensor, region, timeFrame) {
    if (!sensor.value || !region.value || !timeFrame) {
      return Promise.resolve([]);
    }
    return fetcher.fetch1Sensor1RegionNDates(sensor, region, timeFrame).then((rows) => {
      const trends = determineTrends(rows, sensor.highValuesAre);
      return trends.map((trend, i) => {
        return toRow(i, formatDateISO(trend.currentDate), sensor.value, region.value, trend.currentDate, trend);
      });
    });
  }

  $: loadedRows = loadData(sensor, region, timeFrame);
  $: fileName = `${sensor.name}_${region.displayName}_${formatDateISO(timeFrame.min)}_${formatDateISO(timeFrame.max)}`;
</script>

<ATableWidget
  {sensor}
  {region}
  {fileName}
  date={timeFrame}
  {loadedRows}
  rowName="Date"
  bind:highlight
  sortBy="name"
  sortByDesc
/>
