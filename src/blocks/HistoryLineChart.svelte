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
    genUncertaintyLayer,
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
  import { annotationManager, isMobileDevice, metaDataManager } from '../stores';
  import IndicatorAnnotation from '../components/IndicatorAnnotation.svelte';
  import IndicatorAnnotations from '../components/IndicatorAnnotations.svelte';
  import { joinTitle } from '../specs/commonSpec';
  import { TimeFrame } from '../stores/params';
  import { timeDay } from 'd3-time';
  import { resolveAgeStratifications } from '../stores/constants';

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

  export let showNeighbors = true;

  let showFull = false;

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

  $: ageStratifictions = resolveAgeStratifications(sensor.value, $metaDataManager);

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

  function mixTimeFrame(st, dw) {
    const diff = timeDay.count(st.max, dw.max);
    if (diff >= 0 && diff <= 2) {
      // use the "latest"
      return new TimeFrame(st.min, dw.max, st.min_week, dw.max_week);
    }
    return st;
  }

  $: highlightDate = date.value;
  $: showAllDates = showFull && !($isMobileDevice && raw);
  $: timeFrame = showAllDates ? mixTimeFrame(sensor.timeFrame, date.windowTimeFrame) : date.windowTimeFrame;

  /**
   * @param {import('../stores/params').SensorParam} sensor
   * @param {import('..stores/params').RegionParam} region
   * @param {import('../stores/params').DateParam} date
   * @param {import('../stores/params').TimeFrame} timeFrame
   * @param {{height: number, raw: boolean, isMobile: boolean, singleRegionOnly: boolean, stderr: boolean}} options
   */
  function genSpec(
    sensor,
    region,
    date,
    timeFrame,
    { height, raw, isMobile, singleRegionOnly, domain, showNeighbors, stderr, showAge },
  ) {
    const isWeekly = sensor.value.isWeeklySignal;
    const options = {
      initialDate: highlightDate || date.value,
      height,
      color,
      domain: domain || timeFrame.domain,
      zero: false,
      xTitle: sensor.xAxis,
      title: joinTitle([sensor.name, `in ${region.displayName}`], isMobile),
      subTitle: sensor.unit,
      highlightRegion: showAge ? 'signal' : true,
      isWeeklySignal: isWeekly,
      stderr,
    };
    if (raw) {
      return generateLineAndBarSpec(options);
    }
    if (singleRegionOnly) {
      return generateLineChartSpec(options);
    }
    if (showAge) {
      const ageStratifications = showAge.map((d) => d.signal);
      return generateCompareLineSpec([sensor.value.signal, ...ageStratifications], {
        ...options,
        compareField: 'signal',
      });
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
  function loadData(sensor, region, timeFrame, singleRegionOnly, showNeighbors, showAge) {
    if (!region.value) {
      return null;
    }
    const selfData = fetcher.fetch1Sensor1RegionNDates(sensor, region, timeFrame);

    if (singleRegionOnly) {
      return selfData;
    }

    const data = [selfData];

    if (showAge) {
      data.push(
        ...fetcher.fetchNSensor1RegionNDates(
          showAge.map((d) => d.sensor),
          region,
          timeFrame,
        ),
      );
    } else {
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

  function onDblclick(event) {
    let item = event.detail.item;
    while (item && item.datum) {
      item = item.datum;
    }
    if (item != null && item.date_value != null) {
      date.set(item.date_value);
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

  function injectRanges(spec, timeFrame, annotations, multipleRegions) {
    if (annotations.length > 0) {
      spec.layer.unshift(genAnnotationLayer(annotations, timeFrame));
    }
    if (starts && starts > timeFrame.min) {
      spec.layer.unshift(genDateHighlight(starts > timeFrame.max ? timeFrame.max : starts));
    }
    if (ends && ends < timeFrame.max) {
      spec.layer.unshift(genDateHighlight(ends < timeFrame.min ? timeFrame.min : ends));
    }
    const uncertaintyAnnotation = annotations.find((d) => d.uncertainty);
    if (uncertaintyAnnotation) {
      spec.layer.push(genUncertaintyLayer(uncertaintyAnnotation, { color, multipleRegions }));
    }
    return spec;
  }

  export let stderr = false;
  let singleRaw = false;
  let showAgeStratifications = false;

  $: raw = singleRaw && sensor.rawValue != null && !($isMobileDevice && showFull);
  $: regions =
    raw || showAgeStratifications ? [region.value] : resolveRegions(region.value, singleRegionOnly, showNeighbors);
  $: annotations = raw
    ? $annotationManager.getMultiWindowAnnotations(
        [sensor.value, sensor.rawValue],
        regions,
        timeFrame.min,
        timeFrame.max,
        true,
      )
    : $annotationManager.getWindowAnnotations(sensor.value, regions, timeFrame.min, timeFrame.max, true);
  $: spec = injectRanges(
    genSpec(sensor, region, date, timeFrame, {
      height,
      raw,
      isMobile: $isMobileDevice,
      singleRegionOnly,
      domain,
      showNeighbors,
      stderr,
      showAge: showAgeStratifications ? ageStratifictions : false,
    }),
    timeFrame,
    annotations.filter((d) => !d.isAllTime),
    regions.length > 1 || showAgeStratifications,
  );
  $: data = raw
    ? loadSingleData(sensor, region, timeFrame)
    : loadData(
        sensor,
        region,
        timeFrame,
        singleRegionOnly,
        showNeighbors,
        showAgeStratifications ? ageStratifictions : false,
      );
  $: fileName = generateFileName(sensor, regions, timeFrame, raw);

  function findValue(signal, region, data, date, prop = 'value', defaultValue = null) {
    if (!date) {
      return defaultValue;
    }
    const time = toTimeValue(date);
    const row = data.find((d) => d.id === region.id && d.signal == signal && toTimeValue(d.date_value) === time);
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

  let highlightSignal = null;

  function highlightNewSignal(r) {
    highlightSignal = r ? r.signal : sensor.value.signal;
  }

  $: {
    // auto update
    highlightSignal = sensor.value.signal;
  }

  $: toHighlight = showAgeStratifications ? highlightSignal : highlightRegion;

  let vegaRef = null;
</script>

<Vega
  bind:this={vegaRef}
  className="{className} {showFull && !$isMobileDevice ? 'chart-breakout' : ''}"
  {spec}
  {data}
  tooltip={HistoryLineTooltip}
  tooltipProps={{ sensor }}
  signals={{ highlight_tuple: resetOnClearHighlighTuple(date.value), highlightRegion: toHighlight }}
  signalListeners={['highlight']}
  on:signal={onSignal}
  eventListeners={['dblclick']}
  on:dblclick={onDblclick}
/>

<div class="buttons">
  {#if !($isMobileDevice && raw)}
    <Toggle bind:checked={showFull}>All Dates</Toggle>
  {/if}
  {#if !$isMobileDevice && ageStratifictions != null}
    <Toggle bind:checked={showAgeStratifications}>Age Groups</Toggle>
  {/if}
  {#if sensor.rawValue != null && !($isMobileDevice && showAllDates) && !showAgeStratifications}
    <Toggle bind:checked={singleRaw}>Raw Data</Toggle>
  {/if}
  <div class="spacer" />
  <DownloadMenu {fileName} {vegaRef} {data} {sensor} {raw} {stderr} />
</div>

<div class="{!raw && (regions.length > 1 || showAgeStratifications) ? 'mobile-two-col' : ''} legend">
  {#if showAgeStratifications}
    <div
      class="legend-elem"
      style="--color: {color.replace(/rgb\((.*)\)/, '$1')}"
      class:selected={highlightSignal === sensor.value.signal}
      on:mouseenter={() => highlightNewSignal(sensor.value)}
      on:mouseleave={() => highlightNewSignal(null)}
    >
      <span class="legend-symbol">●</span>
      <div>
        <span>
          {region.displayName} (All Ages)
        </span>
      </div>
      <div>
        {#await data then d}
          <span class="legend-value">
            <SensorValue {sensor} value={findValue(sensor.value.signal, region, d, highlightDate)} medium />
          </span>
        {/await}
      </div>
    </div>
    {#each ageStratifictions as r, i}
      <div
        class="legend-elem"
        style="--color: {MULTI_COLORS[i + 1].replace(/rgb\((.*)\)/, '$1')}"
        class:selected={highlightSignal === r.signal}
        on:mouseenter={() => highlightNewSignal(r)}
        on:mouseleave={() => highlightNewSignal(null)}
      >
        <span class="legend-symbol">●</span>
        <div>
          <span>
            {region.displayName} ({r.name})
          </span>
        </div>
        <div>
          {#await data then d}
            <span class="legend-value">
              <SensorValue {sensor} value={findValue(r.signal, region, d, highlightDate)} medium />
            </span>
          {/await}
        </div>
      </div>
    {/each}
  {:else}
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
                Average of {findValue(sensor.value.signal, r, d, highlightDate, 'valid', '0')} {r.displayName}
              {/await}
            {:else}
              {r.displayName}
              {#if showAgeStratifications}
                (All Ages)
              {/if}
            {/if}
            {#if regions.length > 1 && r.id !== neighboringInfo.id}
              <IndicatorAnnotations asHint {sensor} region={r} {date} range="window" />
            {/if}
          </span>
        </div>
        <div>
          {#await data then d}
            <span class="legend-value">
              <SensorValue {sensor} value={findValue(sensor.value.signal, r, d, highlightDate)} medium />
              {#if raw}
                (raw:
                <SensorValue {sensor} value={findValue(sensor.value.signal, r, d, highlightDate, 'raw')} medium />)
              {/if}
            </span>
          {/await}
        </div>
      </div>
    {/each}
  {/if}
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
