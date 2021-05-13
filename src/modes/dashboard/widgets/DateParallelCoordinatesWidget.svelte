<script>
  import { getContext } from 'svelte';
  import { metaDataManager } from '../../../stores';
  import { combineSignals, formatAPITime, parseAPITime } from '../../../data/utils';
  import { formatDateISO } from '../../../formats';
  import { WidgetHighlight } from '../highlight';
  import AParallelCoordinatesWidget, { DEFAULT_STATE, toEntry } from './AParallelCoordinatesWidget.svelte';

  export let id = undefined;
  /**
   * @type {import("../../../stores/params").Sensor[]}
   */
  export let sensors;
  /**
   * @type {import("../../../stores/params").TimeFrame}
   */
  export let timeFrame;
  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  export let initialState = DEFAULT_STATE;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  /**
   * @type {import("../../../stores/DataFetcher").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  /**
   * @param {Entry[]} entries
   * @param {import("../../stores/params").RegionParam} region
   * @param {import("../../stores/params").TimeFrame} timeFrame
   */
  function loadData(entries, region, timeFrame) {
    return Promise.all(entries.map((entry) => fetcher.fetch1Sensor1RegionNDates(entry.sensor, region, timeFrame))).then(
      (rows) => {
        return combineSignals(
          rows,
          rows[0].map((d) => ({ ...d, id: d.time_value.toString() })), // combine to copy
          entries.map((d) => d.id),
        );
      },
    );
  }

  $: entries = sensors.map((sensor, i) => toEntry(sensor, $metaDataManager, region.level, i));
  $: data = loadData(entries, region, timeFrame);
  $: fileName = `Indicators_${region.displayName}}_${formatDateISO(timeFrame.min)}_${formatDateISO(timeFrame.max)}`;

  function isSensorHighlighted(region, timeFrame) {
    return (sensor, highlight) => highlight && highlight.matches(sensor, region, timeFrame);
  }

  function highlightToSpecId(highlight) {
    if (!highlight) {
      return null;
    }
    return formatAPITime(highlight.primaryDate);
  }
  function specIdToHighlight(id) {
    if (!id) {
      return null;
    }
    return new WidgetHighlight(sensors, region, parseAPITime(id));
  }
</script>

<AParallelCoordinatesWidget
  {id}
  on:action
  {initialState}
  on:state
  {region}
  date={timeFrame}
  {data}
  bind:highlight
  {fileName}
  {entries}
  isSensorHighlighted={isSensorHighlighted(region, timeFrame)}
  {highlightToSpecId}
  {specIdToHighlight}
  options={{ colorBy: 'date' }}
/>
