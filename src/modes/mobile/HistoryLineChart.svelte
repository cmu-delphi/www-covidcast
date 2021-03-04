<script>
  import Vega from '../../components/Vega.svelte';
  import { addMissing, averageByDate } from '../../data';
  import { getInfoByName, nationInfo } from '../../maps';
  import getRelatedCounties from '../../maps/related';
  import HistoryLineTooltip from './HistoryLineTooltip.svelte';
  import {
    COLOR,
    generateCompareLineSpec,
    generateLineChartSpec,
    resolveHighlightedDate,
    signalPatches,
    MULTI_COLORS,
  } from '../../specs/lineSpec';
  import { toTimeValue } from '../../stores/params';
  import Toggle from './Toggle.svelte';
  import SensorValue from './SensorValue.svelte';

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
    id: 'related',
    level: 'county',
    name: 'Neighboring Counties',
    population: null,
    propertyId: 'related',
    displayName: 'Neighboring Counties',
  };
  /**
   * @param {import('../../maps').NameInfo} region
   * @param {Date} date
   */
  function genSpec(region, date, height, zero) {
    const options = {
      initialDate: date,
      height,
      zero,
    };
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

  let zoom = false;

  $: spec = genSpec(region.value, date.value, height, !zoom);
  $: data = loadData(sensor, region, date);

  $: highlightDate = date.value;

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

  $: regions = resolveRegions(region.value);
  $: colors = regions.length > 0 ? MULTI_COLORS : [COLOR];

  function findValue(region, data, date) {
    if (!date) {
      return null;
    }
    const time = toTimeValue(date);
    const row = data.find((d) => d.id === region.id && d.time_value === time);
    if (!row) {
      return null;
    }
    return row.value;
  }

  let highlightRegion = null;

  function highlight(r) {
    highlightRegion = r ? r.id : null;
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
    background: var(--color);
  }
  .legend-elem:hover {
    box-shadow: 0 0 2px 0 var(--color);
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
  tooltipProps={{ sensor }}
  signals={{ ...signalPatches, highlightRegion }}
  signalListeners={['highlight']}
  on:signal={onSignal} />

<Toggle bind:checked={zoom}>Zoom Y-axis</Toggle>

<div class="{regions.length > 1 ? 'mobile-two-col' : ''} legend">
  {#each regions as r, i}
    <div
      class="legend-elem"
      style="--color: {colors[i]}"
      on:mouseEnter={() => highlight(r)}
      on:mouseLeave={() => highlight(null)}>
      <div>
        <span class="legend-symbol">●</span>
        <span>
          {#if r.id !== region.id && r.id !== 'related'}
            <a href="?region={r.propertyId}" on:click|preventDefault={() => region.set(r, true)}> {r.displayName} </a>
          {:else}{r.displayName}{/if}
        </span>
      </div>
      <div>
        {#await data then d}
          <span class="legend-value">
            <SensorValue {sensor} value={findValue(r, d, highlightDate)} />
          </span>
        {/await}
      </div>
    </div>
  {/each}
</div>
