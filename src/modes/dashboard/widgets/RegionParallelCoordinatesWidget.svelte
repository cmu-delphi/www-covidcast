<script>
  import { getContext } from 'svelte';
  import { getLevelInfo, stats } from '../../../stores';
  import { combineSignals } from '../../../data/utils';
  import { formatDateISO } from '../../../formats';
  import { addNameInfos } from '../../../data';
  import { highlightToRegions, WidgetHighlight } from '../highlight';
  import { getInfoByName } from '../../../data/regions';
  import AParallelCoordinatesWidget, { DEFAULT_STATE, toEntry } from './AParallelCoordinatesWidget.svelte';

  export let id = undefined;
  /**
   * @type {import("../../../stores/params").Sensor[]}
   */
  export let sensors;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionLevel}
   */
  export let level;

  export let initialState = DEFAULT_STATE;

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
   * @param {Entry[]} entries
   * @param {import("../../stores/params").RegionLevel} level
   * @param {import("../../stores/params").DateParam} date
   */
  function loadData(entries, level, date) {
    return Promise.all(entries.map((entry) => fetcher.fetch1SensorNRegions1Date(entry.sensor, level, '*', date)))
      .then((rows) => {
        return combineSignals(
          rows,
          rows[0].map((d) => ({ ...d })), // combine to copy
          entries.map((d) => d.id),
        );
      })
      .then(addNameInfos)
      .then((rows) => {
        // add a mean line
        const meanEntry = {
          id: 'mean',
          region: 'Mean Value',
          displayName: 'Mean from Metadata',
        };
        entries.forEach((entry) => {
          meanEntry[entry.id] = entry.mean;
        });
        rows.push(meanEntry);
        return rows;
      });
  }

  $: shownLevel = level === 'nation' ? 'state' : level;
  $: entries = sensors.map((sensor, i) => toEntry(sensor, $stats, shownLevel, i));
  $: data = loadData(entries, shownLevel, date);
  $: fileName = `Indicators_${getLevelInfo(shownLevel).labelPlural}_${formatDateISO(date.value)}`;

  function isSensorHighlighted(shownLevel, date) {
    return (sensor, highlight) => highlight && highlight.matches(sensor, shownLevel, date);
  }

  function highlightToSpecId(highlight) {
    if (!highlight) {
      return null;
    }
    const regions = highlightToRegions(shownLevel, highlight);
    if (regions && regions.length > 0) {
      return regions[0].id;
    }
    return null;
  }
  function specIdToHighlight(id) {
    if (!id) {
      return null;
    }
    return new WidgetHighlight(sensors, getInfoByName(id, shownLevel), date.value);
  }
</script>

<AParallelCoordinatesWidget
  {id}
  on:state
  on:action
  {initialState}
  region="US {getLevelInfo(shownLevel).labelPlural}"
  {date}
  {data}
  bind:highlight
  {fileName}
  {entries}
  isSensorHighlighted={isSensorHighlighted(shownLevel, date)}
  {highlightToSpecId}
  {specIdToHighlight}
  options={{ opacity: shownLevel === 'state' ? 0.25 : 0.1 }}
/>
