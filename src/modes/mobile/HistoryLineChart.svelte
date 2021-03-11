<script>
  import Vega from '../../components/Vega.svelte';
  import { addMissing, averageByDate } from '../../data';
  import { getInfoByName, nationInfo } from '../../maps';
  import getRelatedCounties from '../../maps/related';
  import HistoryLineTooltip from './HistoryLineTooltip.svelte';
  import {
    generateCompareLineSpec,
    generateLineChartSpec,
    resolveHighlightedDate,
    generateLineAndBarSpec,
    signalPatches,
    MULTI_COLORS,
  } from '../../specs/lineSpec';
  import { toTimeValue } from '../../stores/params';
  import Toggle from './Toggle.svelte';
  import SensorValue from './SensorValue.svelte';
  import { combineSignals } from '../../data/utils';
  import DownloadMenu from './components/DownloadMenu.svelte';
  import { formatDateISO } from '../../formats';
  import { isMobileDevice } from '../../stores';

  export let height = 250;

  export let className = '';
  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  /**
   * @type {import("../../stores/params").Region}
   */
  const neighboringInfo = {
    id: 'neighboring',
    level: 'county',
    name: 'Neighboring Counties',
    population: null,
    propertyId: 'neighboring',
    displayName: 'Neighboring Counties',
  };

  $: highlightDate = date.value;

  /**
   * @param {import('../../stores/params').SensorParam} sensor
   * @param {import('../../stores/params').RegionParam} region
   * @param {import('../../stores/params').DateParam} date
   */
  function genSpec(sensor, region, date, height, zero, singleRaw, isMobile) {
    const options = {
      initialDate: highlightDate || date.value,
      height,
      color: MULTI_COLORS[0],
      domain: date.windowTimeFrame.domain,
      zero,
      xTitle: sensor.xAxis,
      title: [sensor.name, `in ${region.displayName}`],
      subTitle: sensor.unit,
      highlightRegion: true,
    };
    if (!isMobile || options.title.reduce((acc, v) => acc + v.length, 0) < 35) {
      options.title = options.title.join(' '); // single title line
    }
    if (singleRaw) {
      return generateLineAndBarSpec(options);
    }
    if (region.level === 'state') {
      // state vs nation
      return generateCompareLineSpec([region.displayName, nationInfo.displayName], options);
    }
    if (region.level === 'county') {
      // county vs related vs state vs nation
      const state = getInfoByName(region.state);
      return generateCompareLineSpec(
        [region.displayName, neighboringInfo.displayName, state.displayName, nationInfo.displayName],
        options,
      );
    }
    // nation
    return generateLineChartSpec(options);
  }

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").RegionParam} region
   */
  function loadData(sensor, region, date) {
    if (!region.value || !date.value) {
      return null;
    }
    const selfData = fetcher.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame);

    const data = [selfData];

    if (region.level === 'county') {
      const state = getInfoByName(region.state);
      const stateData = fetcher.fetch1Sensor1RegionNDates(sensor, state, date.windowTimeFrame);
      const relatedCounties = getRelatedCounties(region.value);
      const relatedData = fetcher
        .fetch1SensorNRegionsNDates(sensor, relatedCounties, date.windowTimeFrame)
        .then((r) => averageByDate(r, sensor, neighboringInfo))
        .then((r) => addMissing(r, sensor));
      data.push(relatedData, stateData);
    }
    if (region.level !== 'nation') {
      data.push(fetcher.fetch1Sensor1RegionNDates(sensor, nationInfo, date.windowTimeFrame));
    }
    return Promise.all(data).then((rows) => rows.reverse().flat());
  }

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").RegionParam} region
   */
  function loadSingleData(sensor, region, date) {
    if (!region.value || !date.value) {
      return null;
    }
    const selfData = fetcher.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame);
    const rawData = fetcher.fetch1Sensor1RegionNDates(sensor.rawValue, region, date.windowTimeFrame);

    return Promise.all([selfData, rawData]).then((data) => {
      return combineSignals(data, data[0], ['smoothed', 'raw']);
    });
  }

  function onSignal(event) {
    if (event.detail.name === 'highlight') {
      const date = resolveHighlightedDate(event);
      highlightDate = date;
    }
  }

  function resolveRegions(region) {
    if (region.level === 'state') {
      // state vs nation
      return [region, nationInfo];
    }
    if (region.level === 'county') {
      // county vs related vs state vs nation
      const state = getInfoByName(region.state);
      return [region, neighboringInfo, state, nationInfo];
    }
    return [region];
  }
  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").Region[]} region
   * @param {import("../../stores/params").DateParam} date
   */
  function generateFileName(sensor, regions, date, raw) {
    const regionName = regions.map((region) => `${region.propertyId}-${region.displayName}`).join(',');
    let suffix = '';
    if (raw) {
      suffix = '_RawVsSmoothed';
    }
    return `${sensor.name}_${regionName}_${formatDateISO(date.windowTimeFrame.min)}-${formatDateISO(
      date.windowTimeFrame.max,
    )}${suffix}`;
  }

  let zoom = false;
  let singleRaw = false;

  $: raw = singleRaw && sensor.rawValue != null;
  $: spec = genSpec(sensor, region, date, height, !zoom, raw, $isMobileDevice);
  $: data = raw ? loadSingleData(sensor, region, date) : loadData(sensor, region, date);
  $: regions = raw ? [region.value] : resolveRegions(region.value);
  $: fileName = generateFileName(sensor, regions, date, raw);

  function findValue(region, data, date, prop = 'value') {
    if (!date) {
      return null;
    }
    const time = toTimeValue(date);
    const row = data.find((d) => d.id === region.id && d.time_value === time);
    if (!row) {
      return null;
    }
    return row[prop];
  }

  let highlightRegion = null;

  function highlight(r) {
    highlightRegion = r ? r.id : null;
  }

  $: {
    // auto update
    highlightRegion = region.value.id;
  }

  let vegaRef = null;
</script>

<Vega
  bind:this={vegaRef}
  {className}
  {spec}
  {data}
  tooltip={HistoryLineTooltip}
  tooltipProps={{ sensor }}
  signals={{ ...signalPatches, highlightRegion }}
  signalListeners={['highlight']}
  on:signal={onSignal}
/>

<div class="buttons">
  <Toggle bind:checked={zoom}>Rescale Y-axis</Toggle>
  {#if sensor.rawValue != null}
    <Toggle bind:checked={singleRaw}>Raw Data</Toggle>
  {/if}
  <div class="spacer" />
  <DownloadMenu {fileName} {vegaRef} {data} {sensor} {raw} />
</div>

<div class="{!(singleRaw && sensor.rawValue != null) && regions.length > 1 ? 'mobile-two-col' : ''} legend">
  {#each regions as r, i}
    <div
      class="legend-elem"
      style="--color: {MULTI_COLORS[i].replace(/rgb\((.*)\)/, '$1')}"
      class:selected={highlightRegion === r.id}
      on:mouseenter={() => highlight(r)}
      on:mouseleave={() => highlight(null)}
    >
      <span class="legend-symbol">●</span>
      <div>
        <span>
          {#if r.id !== region.id && r.id !== neighboringInfo.id}
            <a href="?region={r.propertyId}" on:click|preventDefault={() => region.set(r, true)}> {r.displayName} </a>
          {:else}{r.displayName}{/if}
        </span>
      </div>
      <div>
        {#await data then d}
          <span class="legend-value">
            <SensorValue {sensor} value={findValue(r, d, highlightDate)} />
            {#if singleRaw && sensor.rawValue != null}
              (raw:
              <SensorValue {sensor} value={findValue(r, d, highlightDate, 'raw')} />)
            {/if}
          </span>
        {/await}
      </div>
    </div>
  {/each}
</div>

<style>
  .legend {
    font-size: 0.875rem;
    line-height: 2;
  }
  .legend-elem {
    border-radius: 5px;
    padding: 8px;
    border: 1px solid rgb(var(--color));
    position: relative;
    background: rgba(var(--color), 0.05);
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 0.25em;
  }
  .legend-elem:hover,
  .legend-elem.selected {
    box-shadow: 0 0 2px 0 rgb(var(--color));
  }
  .legend-symbol {
    color: rgb(var(--color));
    grid-row-end: span 2;
  }
  .legend-value {
    font-weight: 600;
  }

  .buttons {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .spacer {
    flex: 1 1 0;
  }
</style>
