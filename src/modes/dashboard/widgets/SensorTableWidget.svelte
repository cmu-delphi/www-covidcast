<script>
  import { getContext } from 'svelte';
  import { formatDateISO } from '../../../formats';
  import { sensorList } from '../../../stores';
  import ATableWidget, { DEFAULT_STATE, toRow } from './ATableWidget.svelte';

  export let id = undefined;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  export let initialState = DEFAULT_STATE;

  /**
   * @type {import("../../../stores/DataFetcher").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  /**
   * @param {import("../../../stores/params").RegionParam} region
   * @param {import("../../../stores/params").DateParam} date
   * @returns {Promise<TableRows[]>}
   */
  function loadData(region, date) {
    if (!region.value || !date.value) {
      return Promise.resolve([]);
    }
    // TODO
    return Promise.all(fetcher.fetchNSensors1Region1DateTrend(sensorList, region, date)).then((trends) => {
      return sensorList.map((sensor, i) => {
        const trend = trends[i];
        return toRow(sensor.key, sensor.name, sensor, region.value, date.value, trend);
      });
    });
  }

  $: loadedRows = loadData(region, date);
  $: fileName = `AllIndicators_${region.displayName}_${formatDateISO(date.value)}`;
</script>

<ATableWidget
  {id}
  on:state
  on:action
  {initialState}
  sensor="All Indicators"
  {region}
  {fileName}
  {date}
  {loadedRows}
  rowName="Indicator"
  highlightMatch="sensor"
  bind:highlight
  top={100}
/>
