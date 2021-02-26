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
  } from '../../specs/lineSpec';
  import { selectionColors } from '../../theme';
  import { toTimeValue } from '../../stores/params';
  import Toggle from './Toggle.svelte';

  export let height = 150;

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
  const related = {
    id: 'related',
    level: 'county',
    name: 'Related Counties',
    population: null,
    propertyId: 'related',
    displayName: 'Related Counties',
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
        [region.displayName, related.displayName, state.displayName, nationInfo.displayName],
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
      const related = getRelatedCounties(region.value);
      const relatedData = fetcher
        .fetch1SensorNRegionsNDates(sensor, related, date.windowTimeFrame)
        .then((r) => averageByDate(r, sensor, related))
        .then((r) => addMissing(r, sensor));
      data.push(stateData, relatedData);
    }
    return Promise.all(data).then((rows) => rows.flat());
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
      return [region, related, state, nationInfo];
    }
    return [region];
  }

  $: regions = resolveRegions(region.value);
  const colors = [COLOR, ...selectionColors];

  function findValue(region, data, date) {
    if (!date) {
      return 'N/A';
    }
    const time = toTimeValue(date);
    const row = data.find((d) => d.id === region.id && d.time_value === time);
    if (!row) {
      return 'N/A';
    }
    return sensor.formatValue(row.value);
  }
</script>

<style>
  .legend {
    font-size: 0.875rem;
    line-height: 1.25;
  }
  .legend-elem {
    border-radius: 5px;
    padding: 12px 12px 12px 36px;
    border: 1px solid #f0f1f3;
    position: relative;
  }
  .legend-symbol {
    width: 12px;
    position: absolute;
    left: 12px;
    top: 50%;
    height: 1px;
    transform: translateY(-50%);
    background: var(--color);
  }
  .legend-symbol.thick {
    height: 3px;
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

<Toggle bind:checked={zoom}>Zoom Y-axis</Toggle>

<div class="{regions.length > 1 ? 'mobile-two-col' : ''} legend">
  {#each regions as r, i}
    <div class="legend-elem" style="--color: {colors[i]}">
      <div class="legend-symbol" class:thick={r.id === region.id} />
      <div>
        {#if r.id !== region.id && r.id !== 'related'}
          <a href="?region={r.propertyId}" on:click|preventDefault={() => region.set(r, true)}> {r.displayName} </a>
        {:else}{r.displayName}{/if}
      </div>
      <div class="legend-value">
        {#await data then d}{findValue(r, d, highlightDate)}{/await}
        {#if sensor.isCasesOrDeath}{sensor.unit}{/if}
      </div>
    </div>
  {/each}
</div>
