<script>
  import Vega from '../components/vega/Vega.svelte';
  import { addMissing, averageByDate } from '../data';
  import { nationInfo, getStateOfCounty } from '../data/regions';
  import getRelatedCounties from '../data/relatedRegions';
  import HistoryLineTooltip from './HistoryLineTooltip.svelte';
  import {
    generateCompareLineSpec,
    generateLineChartSpec,
    resolveHighlightedDate,
    generateLineAndBarSpec,
    resetOnClearHighlighTuple,
    MULTI_COLORS,
    genDateHighlight,
    genAnnotationLayer,
  } from '../specs/lineSpec';
  import { toTimeValue } from '../data/utils';
  import Toggle from '../components/Toggle.svelte';
  import SensorValue from '../components/SensorValue.svelte';
  import { combineSignals } from '../data/utils';
  import DownloadMenu from '../components/DownloadMenu.svelte';
  import { formatDateISO, formatWeek } from '../formats';
  import { annotationManager, isMobileDevice } from '../stores';
  import IndicatorAnnotation from '../components/IndicatorAnnotation.svelte';
  import IndicatorAnnotations from '../components/IndicatorAnnotations.svelte';
  import { joinTitle } from '../specs/commonSpec';

  export let height = 250;

  export let className = '';
  /**
   * @type {import("../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  /**
   * @type {Date|null}
   */
  export let starts = null;
  /**
   * @type {Date|null}
   */
  export let ends = null;

  export let expandableWindow = false;

  export let showAnnotations = true;

  export let showNeighbors = true;

  let showFull = expandableWindow === 'full';

  /**
   * show only a single region regardless of the level
   */
  export let singleRegionOnly = false;
  /**
   * base color for the first region
   */
  export let color = MULTI_COLORS[0];

  /**
   * optional domain
   * @type {null | [number, number]}
   */
  export let domain = null;

  /**
   * @type {import("../stores/params").Region}
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
  $: showAllDates = showFull && expandableWindow && !($isMobileDevice && raw);
  $: timeFrame = showAllDates ? sensor.timeFrame : date.windowTimeFrame;

  /**
   * @param {import('../stores/params').SensorParam} sensor
   * @param {import('..stores/params').RegionParam} region
   * @param {import('../stores/params').DateParam} date
   * @param {import('../stores/params').TimeFrame} timeFrame
   * @param {{height: number, zero: boolean, raw: boolean, isMobile: boolean, singleRegionOnly: boolean, stderr: boolean}} options
   */
  function genSpec(
    sensor,
    region,
    date,
    timeFrame,
    { height, zero, raw, isMobile, singleRegionOnly, domain, showNeighbors, stderr },
  ) {
    const isWeekly = sensor.value.isWeeklySignal;
    const options = {
      initialDate: highlightDate || date.value,
      height,
      color,
      domain: domain || timeFrame.domain,
      zero,
      xTitle: sensor.xAxis,
      title: joinTitle([sensor.name, `in ${region.displayName}`], isMobile),
      subTitle: sensor.unit,
      highlightRegion: true,
      isWeeklySignal: isWeekly,
      stderr,
    };
    if (raw) {
      return generateLineAndBarSpec(options);
    }
    if (singleRegionOnly) {
      return generateLineChartSpec(options);
    }
    if (region.level === 'county') {
      // county vs related vs state vs nation
      const state = getStateOfCounty(region);
      const regions = [region.displayName, state.displayName, nationInfo.displayName];
      if (showNeighbors) {
        regions.splice(1, 0, neighboringInfo.displayName);
      }
      return generateCompareLineSpec(regions, options);
    }
    if (region.level !== 'nation') {
      return generateCompareLineSpec([region.displayName, nationInfo.displayName], options);
    }
    return generateLineChartSpec(options);
  }

  /**
   * @param {import("../stores/params").SensorParam} sensor
   * @param {import("../stores/params").DateParam} date
   * @param {import("../stores/params").RegionParam} region
   */
  function loadData(sensor, region, timeFrame, singleRegionOnly, showNeighbors) {
    if (!region.value) {
      return null;
    }
    const selfData = fetcher.fetch1Sensor1RegionNDates(sensor, region, timeFrame);

    if (singleRegionOnly) {
      return selfData;
    }

    const data = [selfData];

    if (region.level === 'county') {
      if (showNeighbors) {
        const relatedCounties = getRelatedCounties(region.value);
        const relatedData = fetcher
          .fetch1SensorNRegionsNDates(sensor, relatedCounties, timeFrame)
          .then((r) => averageByDate(r, neighboringInfo))
          .then((r) => addMissing(r, sensor.isWeeklySignal ? 'week' : 'day'));
        data.push(relatedData);
      }
      const state = getStateOfCounty(region);
      const stateData = fetcher.fetch1Sensor1RegionNDates(sensor, state, timeFrame);
      data.push(stateData);
    }
    if (region.level !== 'nation') {
      data.push(fetcher.fetch1Sensor1RegionNDates(sensor, nationInfo, timeFrame));
    }
    return Promise.all(data).then((rows) => {
      return rows.reverse().flat();
    });
  }

  /**
   * @param {import("../stores/params").SensorParam} sensor
   * @param {import("../stores/params").DateParam} date
   * @param {import("../stores/params").RegionParam} region
   */
  function loadSingleData(sensor, region, timeFrame) {
    if (!region.value) {
      return null;
    }

    const selfData = fetcher.fetch1Sensor1RegionNDates(sensor.value, region, timeFrame);
    const rawData = fetcher.fetch1Sensor1RegionNDates(sensor.rawValue, region, timeFrame);
    return Promise.all([selfData, rawData]).then((data) => {
      return combineSignals(
        data,
        data[0].map((d) => ({ ...d })),
        ['smoothed', 'raw'],
      );
    });
  }

  function onSignal(event) {
    if (event.detail.name === 'highlight') {
      const date = resolveHighlightedDate(event);
      if (highlightDate != date) {
        highlightDate = date;
      }
    }
  }

  function resolveRegions(region, singleRegionOnly, showNeighbors) {
    if (singleRegionOnly) {
      return [region];
    }
    if (region.level === 'county') {
      // county vs related vs state vs nation
      const state = getStateOfCounty(region);
      const regions = [region, state, nationInfo];
      if (showNeighbors) {
        regions.splice(1, 0, neighboringInfo);
      }
      return regions;
    }
    if (region.level !== 'nation') {
      // state vs nation
      return [region, nationInfo];
    }
    return [region];
  }
  /**
   * @param {import("../stores/params").SensorParam} sensor
   * @param {import("../stores/params").Region[]} region
   */
  function generateFileName(sensor, regions, timeFrame, raw) {
    const regionName = regions.map((region) => `${region.propertyId}-${region.displayName}`).join(',');
    let suffix = '';
    if (raw) {
      suffix = '_RawVsSmoothed';
    }
    return `${sensor.name}_${regionName}_${
      sensor.isWeeklySignal ? formatWeek(timeFrame.min_week) : formatDateISO(timeFrame.min)
    }-${sensor.isWeeklySignal ? formatWeek(timeFrame.max_week) : formatDateISO(timeFrame.max)}${suffix}`;
  }

  function injectRanges(spec, timeFrame, annotations) {
    if (annotations.length > 0) {
      spec.layer.unshift(genAnnotationLayer(annotations, timeFrame));
    }
    if (starts && starts > timeFrame.min) {
      spec.layer.unshift(genDateHighlight(starts > timeFrame.max ? timeFrame.max : starts));
    }
    if (ends && ends < timeFrame.max) {
      spec.layer.unshift(genDateHighlight(ends < timeFrame.min ? timeFrame.min : ends));
    }
    return spec;
  }

  let zero = false;
  export let stderr = false;
  let singleRaw = false;

  $: raw = singleRaw && sensor.rawValue != null && !($isMobileDevice && showFull);
  $: regions = raw ? [region.value] : resolveRegions(region.value, singleRegionOnly, showNeighbors);
  $: annotations = showAnnotations
    ? $annotationManager.getWindowAnnotations(sensor.value, regions, timeFrame.min, timeFrame.max)
    : [];
  $: spec = injectRanges(
    genSpec(sensor, region, date, timeFrame, {
      height,
      zero,
      raw,
      isMobile: $isMobileDevice,
      singleRegionOnly,
      domain,
      showNeighbors,
      stderr,
    }),
    timeFrame,
    annotations,
  );
  $: data = raw
    ? loadSingleData(sensor, region, timeFrame)
    : loadData(sensor, region, timeFrame, singleRegionOnly, showNeighbors);
  $: fileName = generateFileName(sensor, regions, timeFrame, raw);

  function findValue(region, data, date, prop = 'value', defaultValue = null) {
    if (!date) {
      return defaultValue;
    }
    const time = toTimeValue(date);
    const row = data.find((d) => d.id === region.id && toTimeValue(d.date_value) === time);
    if (!row) {
      return defaultValue;
    }
    return row[prop];
  }

  let highlightRegion = null;

  function highlight(r) {
    highlightRegion = r ? r.id : region.value.id;
  }

  $: {
    // auto update
    highlightRegion = region.value.id;
  }

  let vegaRef = null;
</script>

<Vega
  bind:this={vegaRef}
  className="{className} {showFull && expandableWindow && !$isMobileDevice ? 'chart-breakout' : ''}"
  {spec}
  {data}
  tooltip={HistoryLineTooltip}
  tooltipProps={{ sensor }}
  signals={{ highlight_tuple: resetOnClearHighlighTuple(date.value), highlightRegion }}
  signalListeners={['highlight']}
  on:signal={onSignal}
/>

<div class="buttons">
  <Toggle bind:checked={zero}>Include 0 in Y-axis</Toggle>
  {#if sensor.rawValue != null && !($isMobileDevice && showAllDates)}
    <Toggle bind:checked={singleRaw}>Raw Data</Toggle>
  {/if}
  {#if expandableWindow === true && !($isMobileDevice && raw)}
    <Toggle bind:checked={showFull}>Show All Dates</Toggle>
  {/if}
  <div class="spacer" />
  <DownloadMenu {fileName} {vegaRef} {data} {sensor} {raw} {stderr} />
</div>

<div class="{!raw && regions.length > 1 ? 'mobile-two-col' : ''} legend">
  {#each regions as r, i}
    <div
      class="legend-elem"
      style="--color: {(i === 0 ? color : MULTI_COLORS[i]).replace(/rgb\((.*)\)/, '$1')}"
      class:selected={highlightRegion === r.id}
      on:mouseenter={() => highlight(r)}
      on:mouseleave={() => highlight(null)}
    >
      <span class="legend-symbol">●</span>
      <div>
        <span>
          {#if r.id !== region.id && r.id !== neighboringInfo.id}
            <a href="?region={r.propertyId}" on:click|preventDefault={() => region.set(r, true)}> {r.displayName} </a>
          {:else if r.id === neighboringInfo.id}
            {#await data}
              {r.displayName}
            {:then d}
              Average of {findValue(r, d, highlightDate, 'valid', '0')} {r.displayName}
            {/await}
          {:else}
            {r.displayName}
          {/if}
          {#if regions.length > 1 && r.id !== neighboringInfo.id}
            <IndicatorAnnotations asHint {sensor} region={r} {date} range="window" />
          {/if}
        </span>
      </div>
      <div>
        {#await data then d}
          <span class="legend-value">
            <SensorValue {sensor} value={findValue(r, d, highlightDate)} medium />
            {#if raw}
              (raw:
              <SensorValue {sensor} value={findValue(r, d, highlightDate, 'raw')} medium />)
            {/if}
          </span>
        {/await}
      </div>
    </div>
  {/each}
</div>

{#each annotations as annotation}
  <IndicatorAnnotation {annotation} />
{/each}

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
