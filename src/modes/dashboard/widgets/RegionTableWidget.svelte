<script>
  import { getContext } from 'svelte';
  import { formatDateISO } from '../../../formats';
  import { determineTrend } from '../../../stores/trend';
  import { infosByLevel, nationInfo } from '../../../data/regions';
  import { groupByRegion } from '../../../stores/params';
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
   * @type {import("../../../stores/params").DataFetcher}
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
    function toGeoTableRow(region, data, important = false) {
      const trend = determineTrend(date.value, data, sensor.highValuesAre);
      return toRow(region.propertyId, region.displayName, sensor.value, region, date.value, trend, important);
    }
    function loadImpl(regions, isAll = false) {
      return fetcher.fetch1SensorNRegionsNDates(sensor, regions, date.windowTimeFrame, isAll).then((data) => {
        const groups = groupByRegion(data);
        return regions.map((region) => {
          const data = groups.get(region.propertyId) || [];
          return toGeoTableRow(region, data);
        });
      });
    }
    function loadSingle(r, important = false) {
      return fetcher
        .fetch1Sensor1RegionNDates(sensor, r, date.windowTimeFrame)
        .then((rows) => toGeoTableRow(r, rows, important));
    }
    // if (region.level === 'county') {
    //   return Promise.all([
    //     loadSingle(nationInfo, true),
    //     loadSingle(getStateOfCounty(region.value), true),
    //     loadSingle(region.value),
    //     loadImpl(getRelatedCounties(region.value)),
    //   ]).then((r) => r.flat());
    // }
    const regions = infosByLevel[level];
    return Promise.all([loadSingle(nationInfo, true), loadImpl(regions)]).then((r) => r.flat());
  }

  $: shownLevel = level === 'nation' ? 'state' : level;
  $: loadedRows = loadData(sensor, date, shownLevel);
  $: fileName = `${sensor.name}_${getLevelInfo(level).labelPlural}_${formatDateISO(date.value)}`;
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
  bind:highlight
/>
