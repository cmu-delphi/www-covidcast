<script>
  import { isMobileDevice, metaDataManager } from '../../stores';
  import { DataFetcher } from '../../stores/DataFetcher';
  import Toggle from '../../components/Toggle.svelte';
  import Vega from '../../components/vega/Vega.svelte';
  import SensorValue from '../../components/SensorValue.svelte';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
  import { timeDay } from 'd3-time';
  import {
    generateCompareLineSpec,
    MULTI_COLORS,
    resetOnClearHighlighTuple,
    resolveHighlightedDate,
  } from '../../specs/lineSpec';
  import { joinTitle } from '../../specs/commonSpec';
  import { toTimeValue } from '../../data/utils';
  import { formatDateISO, formatWeek } from '../../formats';
  import { SensorParam } from '../../stores/params';
  import { throttle } from 'lodash';
  import { EpiWeek } from '../../data/EpiWeek';

  /**
   * @type {import('../../data/sensor').Sensor}
   */
  export let sensor;
  /**
   * @type {import('../../data/regions').Region | null}
   */
  export let region = null;

  let asOfValueBounced = null;
  let asOfValue = null;

  const debounceUpdate = throttle((val) => {
    if (val && (/\d{4}-\d{2}-\d{2}/.test(val) || /\d{4}W?\d{2}/.test(val))) {
      asOfValue = val;
    }
  }, 500);
  $: {
    debounceUpdate(asOfValueBounced);
  }

  $: sensorParam = new SensorParam(sensor, $metaDataManager);
  $: timeFrame = sensorParam.timeFrame;

  $: highlightDate = timeFrame.max;

  /**
   * @param {import('../../stores/params').SensorParam} sensor
   * @param {import('../../stores/params').Region} region
   * @param {{height: number, zero: boolean, raw: boolean, isMobile: boolean, singleRegionOnly: boolean, cumulative: boolean}} options
   */
  function genSpec(sensor, region, timeFrame, { zero, isMobile }) {
    const options = {
      initialDate: highlightDate || timeFrame.max,
      domain: timeFrame.domain,
      zero,
      xTitle: sensor.xAxis,
      title: joinTitle([sensor.name, `in ${region.displayName}`], isMobile),
      subTitle: sensor.unit,
      highlightRegion: 'issue_mode',
      compareField: 'issue_mode',
      isWeeklySignal: sensor.isWeeklySignal,
    };
    return generateCompareLineSpec(['latest', 'as_of'], options);
  }

  function onSignal(event) {
    if (event.detail.name === 'highlight') {
      const date = resolveHighlightedDate(event);
      if (highlightDate != date) {
        highlightDate = date;
      }
    }
  }
  const fetcher = new DataFetcher();
  function loadData(sensor, region, timeFrame, asOf) {
    const latest = fetcher.fetch1Sensor1RegionNDates(sensor, region, timeFrame, { advanced: true }).then((rows) =>
      rows.map((r) => {
        r.issue_mode = 'latest';
        return r;
      }),
    );
    if (!asOf) {
      return latest;
    }
    const asOfDate = sensor.isWeeklySignal ? EpiWeek.parse(asOf) : timeDay.floor(new Date(asOf));
    const asOfFetcher = new DataFetcher(asOfDate);

    const asOfData = asOfFetcher.fetch1Sensor1RegionNDates(sensor, region, timeFrame, { advanced: true }).then((rows) =>
      rows.map((r) => {
        r.issue_mode = 'as_of';
        return r;
      }),
    );
    return Promise.all([latest, asOfData]).then((rows) => rows[0].concat(rows[1]));
  }

  let zoom = false;

  $: spec = genSpec(sensor, region, timeFrame, {
    zero: !zoom,
    isMobile: $isMobileDevice,
  });
  $: data = loadData(sensor, region, timeFrame, asOfValue);
  $: fileName = `${sensor.name}_${region.displayName}_${
    sensor.isWeeklySignal ? formatWeek(timeFrame.minWeek) : formatDateISO(timeFrame.min)
  }-${sensor.isWeeklySignal ? formatWeek(timeFrame.maxWeek) : formatDateISO(timeFrame.max)}`;

  function findValue(data, date, mode) {
    if (!date) {
      return null;
    }
    const time = toTimeValue(date);
    const row = data.find((d) => toTimeValue(d.date_value) === time && d.issue_mode == mode);
    if (!row) {
      return null;
    }
    return row.value;
  }

  let highlightAsOf = 'latest';

  function highlight(val) {
    highlightAsOf = val;
  }

  let vegaRef = null;
</script>

<div class="grid-1 grid-span-12">
  <div class="chart-300">
    <Vega
      bind:this={vegaRef}
      {spec}
      {data}
      signals={{ highlight_tuple: resetOnClearHighlighTuple(timeFrame.max), highlightRegion: highlightAsOf }}
      signalListeners={['highlight']}
      on:signal={onSignal}
    />
  </div>
</div>
<div class="grid-3-11">
  <div class="buttons">
    <Toggle bind:checked={zoom}>Rescale Y-axis</Toggle>
    <div class="spacer" />
    <DownloadMenu {fileName} {vegaRef} {data} {sensor} />
  </div>

  <div class="mobile-two-col legend">
    <div
      class="legend-elem"
      style="--color: {MULTI_COLORS[0].replace(/rgb\((.*)\)/, '$1')}"
      class:selected={highlightAsOf == 'latest'}
      on:mouseenter={() => highlight('latest')}
      on:mouseleave={() => highlight(null)}
    >
      <span class="legend-symbol">●</span>
      <div>
        <span>
          {region.displayName} (latest issue)
        </span>
      </div>
      <div>
        {#await data then d}
          <span class="legend-value">
            <SensorValue sensor={sensorParam} value={findValue(d, highlightDate, 'latest')} medium />
          </span>
        {/await}
      </div>
    </div>
    <div
      class="legend-elem"
      style="--color: {MULTI_COLORS[1].replace(/rgb\((.*)\)/, '$1')}"
      class:selected={highlightAsOf === 'as_of'}
      on:mouseenter={() => highlight('as_of')}
      on:mouseleave={() => highlight(null)}
    >
      <span class="legend-symbol">●</span>
      <div>
        <span>
          {region.displayName} (as of
          {#if sensor.isWeeklySignal}
            <input
              class="option-picker-input"
              bind:value={asOfValueBounced}
              pattern="\d\d\d\dW?\d\d"
              placeholder="Epiweek (e.g., 2021W22)"
            />{:else}
            <input type="date" class="option-picker-input" bind:value={asOfValueBounced} />{/if})
        </span>
      </div>
      <div>
        {#if asOfValue}
          {#await data then d}
            <span class="legend-value">
              <SensorValue sensor={sensorParam} value={findValue(d, highlightDate, 'as_of')} medium />
            </span>
          {/await}
        {/if}
      </div>
    </div>
  </div>
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
