<script>
  import {
    signalCasesOrDeathOptions,
    currentDateObject,
    smallMultipleTimeSpan,
    highlightTimeValue,
  } from '../../stores';
  import { addMissing, fetchTimeSlice } from '../../data/fetchData';
  import Vega from '../Vega.svelte';
  import { createSpec, patchSpec } from './vegaSpec';
  import { createEventDispatcher, onMount } from 'svelte';
  import { levelMegaCounty, primaryValue } from '../../stores/constants';
  import EncodingOptions from '../EncodingOptions.svelte';
  import { trackEvent } from '../../stores/ga';
  import VegaTooltip from './VegaTooltip.svelte';
  import InfoDialogButton from '../InfoDialogButton.svelte';
  import { downloadUrl } from '../../util';
  import { parseAPITime } from '../../../src/data/utils';
  import { formatAPITime } from '../../../src/data/utils';

  const dispatch = createEventDispatcher();
  /**
   * @type {import('../../data/fetchData').SensorEntry}
   */
  export let sensor;

  $: currentDateItem = formatAPITime($currentDateObject);

  $: mapTitle =
    typeof sensor.mapTitleText === 'function' ? sensor.mapTitleText($signalCasesOrDeathOptions) : sensor.mapTitleText;

  function fetchMulti(sensor, selections) {
    return Promise.all(
      selections.map((s) => {
        const region = s.info;
        if (region.level === levelMegaCounty.id) {
          return [];
        }
        return fetchTimeSlice(sensor, region.level, region.propertyId, undefined, undefined, false, {
          geo_value: region.propertyId,
        })
          .then(addMissing)
          .then((rows) =>
            rows.map((row) => {
              row.displayName = region.displayName;
              return row;
            }),
          );
      }),
    ).then((rows) => rows.flat());
  }
  /**
   * @type {{info: import('../../maps').NameInfo, color: string}[]}
   */
  export let selections = [];
  $: region = selections.length > 0 ? selections[0].info : null;
  $: hasRegion = selections.length > 0;
  $: multi = selections.length > 1;
  $: isMegaRegion = Boolean(region) && region.level === levelMegaCounty.id;
  $: noDataText = hasRegion ? (isMegaRegion ? `Please select a county` : 'No data available') : 'No location selected';
  $: data = multi
    ? fetchMulti(sensor, selections)
    : region && !isMegaRegion
    ? fetchTimeSlice(sensor, region.level, region.propertyId, undefined, undefined, false, {
        geo_value: region.propertyId,
      }).then((rows) => addMissing(rows, sensor))
    : [];

  // The currently selected detailViewTimeSpan, initially defaults to the smallMultipleTimeSpan.
  // Modified by onDateRangeChange, and fetched via (non-reactive) getDateRange,
  // to avoid updating the chart immediately, so it will be used as the initial value the
  // next time createSpec is called.  Reloading the component will reset to the default.
  $: detailViewTimeSpan = detailViewTimeSpan || $smallMultipleTimeSpan;

  function getDateRange() {
    if (detailViewTimeSpan.length === 0) {
      detailViewTimeSpan = $smallMultipleTimeSpan;
    }
    return detailViewTimeSpan;
  }

  function onDateRangeChange(event) {
    // All signal events are sent to all on:signal handlers (??), so check if this is the right handler.
    if (event.detail.name !== 'dateRange') {
      return;
    }
    const dr = event.detail.value && event.detail.value.date_value;
    if (dr && Array.isArray(dr) && dr.length > 0) {
      if (
        (!Number.isNaN(dr[0]) && dr[0] !== detailViewTimeSpan[0].getTime()) ||
        (!Number.isNaN(dr[1]) && dr[1] !== detailViewTimeSpan[1].getTime())
      ) {
        detailViewTimeSpan = [new Date(dr[0]), new Date(dr[1])];
      }
    }
  }

  $: title = `${sensor.name} in ${
    selections.length > 0 ? selections.map((d) => d.info.displayName).join(', ') : 'Unknown'
  }`;
  $: sensorPrimaryValue = primaryValue(sensor, $signalCasesOrDeathOptions);

  $: spec = createSpec(sensor, primaryValue(sensor, $signalCasesOrDeathOptions), selections, getDateRange(), [
    title,
    mapTitle,
  ]);

  $: isCumulative = $signalCasesOrDeathOptions.cumulative;

  /**
   * @param {KeyboardEvent} e
   */
  function onEscCheck(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      trackEvent('detail-view', 'close', 'keyboard');
      restoreFocus();
      dispatch('close');
    }
  }

  let close = null;
  let oldFocus = null;

  onMount(() => {
    if (close) {
      oldFocus = document.activeElement;
      close.focus();
    }
  });

  function restoreFocus() {
    if (oldFocus) {
      oldFocus.focus();
      oldFocus = null;
    }
  }

  // Reference to the vega chart component.
  let vegaRef = null;

  function downloadVega() {
    vegaRef.vegaAccessor().then((view) => {
      const pngP = view.toImageURL('png', 2);
      const filename = hasRegion ? selections.map((d) => d.info.displayName).join(', ') : 'Unknown';
      pngP.then((url) => {
        downloadUrl(url, `${sensor.name} in ${filename}.png`);
      });
    });
  }
</script>

<style>
  .single-sensor-chart {
    flex: 1 1 0;
  }

  .buttons {
    z-index: 10;
    position: absolute;
    right: 0.5em;
    top: 0.5em;
  }

  .vega-wrapper {
    position: relative;
  }
  .vega-wrapper > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }

  .encoding {
    padding-top: 0.5em;
  }

  .legend {
    font-size: 80%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .legend-avg {
    margin-right: 0.2em;
    width: 1.5em;
    height: 2px;
    background: grey;
  }
  .legend-count {
    margin-left: 0.5em;
    opacity: 0.2;
  }
</style>

<div class="buttons">
  <button
    title="Download this view"
    class="uk-icon-button"
    data-uk-icon="icon: download"
    on:click={downloadVega}
    disabled={!vegaRef} />
  <InfoDialogButton {sensor} large={true} />
  <button
    bind:this={close}
    class="uk-icon-button"
    data-uk-close
    on:click={() => {
      trackEvent('detail-view', 'close', 'button');
      restoreFocus();
      dispatch('close');
    }}
    title="Close this detail view" />
</div>
<div class="single-sensor-chart vega-wrapper">
  <Vega
    bind:this={vegaRef}
    {data}
    {spec}
    {patchSpec}
    {noDataText}
    signals={{ currentDate: $currentDateObject, highlightTimeValue }}
    signalListeners={['dateRange', 'highlight']}
    on:signal={onDateRangeChange}
    tooltip={VegaTooltip}
    tooltipProps={{ sensor, currentDateItem }} />
</div>
{#if sensor.isCasesOrDeath && !isCumulative}
  <div class="legend">
    <div class="legend-avg" />
    <div>7-day average</div>
    <div class="legend-avg legend-count" />
    <div>Raw data</div>
  </div>
{/if}
<div class="encoding">
  <EncodingOptions center {sensor} />
</div>

<div>
  Date range details Current Date:
  {$currentDateObject}
  <br />
  Hightlight Time:
  {parseAPITime($highlightTimeValue)}
</div>

<svelte:window on:keydown={onEscCheck} />
