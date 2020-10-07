<script>
  import { currentInfoSensor, smallMultipleTimeSpan } from '../../stores';
  import { addMissing, fetchTimeSlice } from '../../data/fetchData';
  import { levelMegaCounty } from '../../stores/constants';
  import IoMdHelp from 'svelte-icons/io/IoMdHelp.svelte';
  import { createSpec } from '../overview/vegaSpec';
  import { MAP_THEME } from '../../theme';
  import VegaTooltip from '../../components/DetailView/VegaTooltip.svelte';
  import Vega from '../../components/Vega.svelte';
  import { timeFormat } from 'd3-time-format';
  import { formatAPITime, parseAPITime } from '../../data';

  const formatLocal = timeFormat('%x');
  /**
   * @type {import("../../stores/constants").SensorEntry}
   */
  export let sensor;
  /**
   * @type {import("../../maps").NameInfo}
   */
  export let region;

  /**
   * @type {Date}
   */
  export let date;

  export let onHighlight;
  export let highlightTimeValue;

  $: highlightDate = highlightTimeValue != null ? parseAPITime(highlightTimeValue) : null;

  $: isMegaRegion = Boolean(region) && region.level === levelMegaCounty.id;
  $: noDataText =
    region != null ? (isMegaRegion ? `Please select a county` : 'No data available') : 'No location selected';

  // use local variables with manual setting for better value comparison updates
  let startDay = $smallMultipleTimeSpan[0];
  let endDay = $smallMultipleTimeSpan[1];
  $: {
    if (startDay.getTime() !== $smallMultipleTimeSpan[0].getTime()) {
      startDay = $smallMultipleTimeSpan[0];
    }
    if (endDay.getTime() !== $smallMultipleTimeSpan[1].getTime()) {
      endDay = $smallMultipleTimeSpan[1];
    }
  }

  /**
   * @type {Promise<import('../../data').EpiDataRow[]> | import('../../data').EpiDataRow[]}
   */
  $: data =
    region && !isMegaRegion
      ? fetchTimeSlice(sensor, region.level, region.propertyId, startDay, endDay, false, {
          geo_value: region.propertyId,
        })
          .then(addMissing)
          .then((rows) =>
            rows.map((row) => {
              row.displayName = region.displayName;
              return row;
            }),
          )
      : [];

  $: spec = createSpec(sensor, region ? [{ info: region, color: MAP_THEME.selectedRegionOutline }] : [], [
    startDay,
    endDay,
  ]);

  /**
   * @type {number | null}
   */
  let value = null;

  $: {
    const keyDate = formatAPITime(highlightDate ? highlightDate : date);
    Promise.resolve(data).then((rows) => {
      const row = rows.find((d) => String(d.time_value) === keyDate);
      value = row ? row.value : null;
    });
  }

  let loading = false;
</script>

<style>
  .card {
    margin: 0.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    height: 2.2em;
  }

  h4 {
    text-align: center;
  }

  .toolbar {
    margin-left: 0.5em;
  }

  .vega-wrapper {
    width: 100%;
    flex: 1 1 8em;
    position: relative;
  }
  .vega-wrapper > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 2px;
    bottom: 0;
  }

  .info {
    font-size: 0.6rem;
  }

  .key {
    padding: 0.5em;
  }

  .key-fact {
    font-weight: bold;
    font-size: 120%;
  }
</style>

<section class="card container-bg container-style" class:loading>
  <div class="header">
    <h4>{typeof sensor.mapTitleText === 'function' ? sensor.mapTitleText() : sensor.name}</h4>
    <div class="toolbar">
      {#if sensor.longDescription}
        <button
          title="Show sensor description"
          class="pg-button pg-button-circle info"
          on:click={() => {
            currentInfoSensor.set(sensor);
          }}><IoMdHelp /></button>
      {/if}
    </div>
  </div>
  <div class="key">
    <span class="key-fact">{value != null ? sensor.formatValue(value) : '?'}</span>
    <span class="hint">on {formatLocal(highlightDate ? highlightDate : date)}</span>
  </div>
  <main class="vega-wrapper">
    <Vega
      {data}
      {spec}
      {noDataText}
      signals={{ currentDate: date, highlightTimeValue }}
      signalListeners={['highlight']}
      on:signal={onHighlight}
      tooltip={VegaTooltip}
      tooltipProps={{ sensor }} />
  </main>
</section>
