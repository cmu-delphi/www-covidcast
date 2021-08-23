<script>
  import { getContext } from 'svelte';
  import { formatDateISO, formatWeek } from '../../../formats';
  import { infosByLevel, nationInfo } from '../../../data/regions';
  import { getLevelInfo } from '../../../stores';
  import ATableWidget, { toRow, DEFAULT_STATE } from './ATableWidget.svelte';

  export let id = undefined;
  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionLevel}
   */
  export let level;

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
   * @typedef {object} TableRow
   * @property {string} id
   * @property {string} name
   * @property {import('../highlight').WidgetHighlight} highlight
   * @property {boolean} important
   */

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").DateParam} date
   * @param {import("../../../stores/params").RegionLevel} level
   * @returns {Promise<TableRows[]>}
   */
  function loadData(sensor, date, level) {
    if (!sensor.value || !date.value || !level) {
      return Promise.resolve([]);
    }
    const regions = [nationInfo, ...infosByLevel[level]];

    const rows = fetcher.fetch1SensorNRegionsDateTrend(sensor, regions, date).map((trend, i) => {
      const region = regions[i];
      const important = region === nationInfo;
      return trend.then((t) =>
        toRow(region.propertyId, region.displayName, sensor.value, region, date.value, t, important),
      );
    });

    return Promise.all(rows);
  }

  $: shownLevel = level === 'nation' ? 'state' : level;
  $: loadedRows = loadData(sensor, date, shownLevel);
  $: fileName = `${sensor.name}_${getLevelInfo(level).labelPlural}_${
    sensor.isWeeklySignal ? formatWeek(date.week) : formatDateISO(date.value)
  }`;
</script>

<ATableWidget
  {id}
  on:state
  on:action
  {initialState}
  {sensor}
  region="US {getLevelInfo(shownLevel).labelPlural}"
  {fileName}
  {date}
  {loadedRows}
  rowName="Region"
  highlightMatch="region"
  bind:highlight
/>
