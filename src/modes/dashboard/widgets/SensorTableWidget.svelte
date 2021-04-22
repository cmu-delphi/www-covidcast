<script>
  import { getContext } from 'svelte';
  import { formatDateISO } from '../../../formats';
  import { sensorList } from '../../../stores';
  import { determineTrend } from '../../../stores/trend';
  import ATableWidget, { toRow } from './ATableWidget.svelte';

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

  /**
   * @type {import("../../../stores/params").DataFetcher}
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
    return Promise.all(fetcher.fetchNSensor1RegionNDates(sensorList, region, date.windowTimeFrame)).then(
      (sensorRows) => {
        return sensorList.map((sensor, i) => {
          const rows = sensorRows[i];
          const trend = determineTrend(date.value, rows, sensor.highValuesAre);
          return toRow(sensor.key, sensor.name, sensor, region.value, date.value, trend);
        });
      },
    );
  }

  $: loadedRows = loadData(region, date);
  $: fileName = `AllIndicators_${region.displayName}_${formatDateISO(date.value)}`;
</script>

<ATableWidget
  sensor="All Indicators"
  {region}
  {fileName}
  {date}
  {loadedRows}
  rowName="Indicator"
  bind:highlight
  sortBy="name"
  top={100}
/>
