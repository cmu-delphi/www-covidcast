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
  import { combineSignals } from '../../data/utils';

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
  const relatedInfo = {
    id: 'related',
    level: 'county',
    name: 'Related Counties',
    population: null,
    propertyId: 'related',
    displayName: 'Related Counties',
  };

  $: highlightDate = date.value;

  /**
   * @param {import('../../maps').NameInfo} region
   * @param {Date} date
   */
  function genSpec(region, date, height, zero, singleRaw) {
    const options = {
      initialDate: highlightDate || date,
      height,
      color: MULTI_COLORS[0],
      zero,
    };
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
        [region.displayName, relatedInfo.displayName, state.displayName, nationInfo.displayName],
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
    if (region.level !== 'nation') {
      data.push(fetcher.fetch1Sensor1RegionNDates(sensor, nationInfo, date.windowTimeFrame));
    }

    if (region.level === 'county') {
      const state = getInfoByName(region.state);
      const stateData = fetcher.fetch1Sensor1RegionNDates(sensor, state, date.windowTimeFrame);
      const relatedCounties = getRelatedCounties(region.value);
      const relatedData = fetcher
        .fetch1SensorNRegionsNDates(sensor, relatedCounties, date.windowTimeFrame)
        .then((r) => averageByDate(r, sensor, relatedInfo))
        .then((r) => addMissing(r, sensor));
      data.push(stateData, relatedData);
    }
    return Promise.all(data).then((rows) => rows.flat());
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
      return [region, relatedInfo, state, nationInfo];
    }
    return [region];
  }

  let zoom = false;
  let singleRaw = false;

  $: spec = genSpec(region.value, date.value, height, !zoom, singleRaw && sensor.rawValue != null);
  $: data =
    singleRaw && sensor.rawValue != null ? loadSingleData(sensor, region, date) : loadData(sensor, region, date);
  $: regions = singleRaw && sensor.rawValue != null ? [region.value] : resolveRegions(region.value);

  function findValue(region, data, date) {
    if (!date) {
      return 'N/A';
    }
    const time = toTimeValue(date);
    const row = data.find((d) => d.id === region.id && d.time_value === time);
    if (!row) {
      return 'N/A';
    }
    const value = sensor.formatValue(row.value);
    if (!singleRaw) {
      return value;
    }
    return `${value} (raw: ${sensor.formatValue(row.raw)})`;
  }
</script>

<style>
  .legend {
    font-size: 0.875rem;
    line-height: 2;
  }
  .legend-elem {
    border-radius: 5px;
    padding: 8px;
    border: 1px solid var(--color);
    position: relative;
  }
  .legend-symbol {
    color: var(--color);
  }
  .legend-value {
    font-weight: 600;
  }
</style>

<Vega
  {className}
  {spec}
  {data}
  tooltip={HistoryLineTooltip}
  signals={signalPatches}
  signalListeners={['highlight']}
  on:signal={onSignal} />

<div>
  <Toggle bind:checked={zoom}>Zoom Y-axis</Toggle>
  {#if sensor.rawValue != null}
    <Toggle bind:checked={singleRaw}>Raw Data</Toggle>
  {/if}
</div>

<div class="{!(singleRaw && sensor.rawValue != null) && regions.length > 1 ? 'mobile-two-col' : ''} legend">
  {#each regions as r, i}
    <div class="legend-elem" style="--color: {MULTI_COLORS[i]}">
      <div>
        <span class="legend-symbol">●</span>
        <span>
          {#if r.id !== region.id && r.id !== 'related'}
            <a href="?region={r.propertyId}" on:click|preventDefault={() => region.set(r, true)}> {r.displayName} </a>
          {:else}{r.displayName}{/if}
        </span>
      </div>
      <div>
        {#await data then d}<span class="legend-value">{findValue(r, d, highlightDate)}</span>{/await}
        {#if sensor.isCasesOrDeath}{sensor.unit}{/if}
      </div>
    </div>
  {/each}
</div>
