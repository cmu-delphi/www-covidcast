<script>
  import { getContext } from 'svelte';
  import { formatDateISO } from '../../../formats';
  import ATableWidget, { DEFAULT_STATE, toRow } from './ATableWidget.svelte';

  export let id = undefined;
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

  export let initialState = { ...DEFAULT_STATE, sortCriteriaDesc: true };

  /**
   * @type {import("../../../stores/DataFetcher").DataFetcher}
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
    return fetcher.fetch1Sensor1RegionNDatesTrend(sensor, region, timeFrame).then((trends) => {
      return trends.map((trend, i) => {
        // TODO week
        return toRow(i, formatDateISO(trend.date), sensor.value, region.value, trend.date, trend);
      });
    });
  }

  $: loadedRows = loadData(sensor, region, timeFrame);
  $: fileName = `${sensor.name}_${region.displayName}_${formatDateISO(timeFrame.min)}_${formatDateISO(timeFrame.max)}`;
</script>

<ATableWidget
  {id}
  on:action
  on:state
  {initialState}
  {sensor}
  {region}
  {fileName}
  date={timeFrame}
  {loadedRows}
  highlightMatch="date"
  rowName="Date"
  bind:highlight
/>
