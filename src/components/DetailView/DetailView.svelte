<script>
  import {
    signalCasesOrDeathOptions,
    currentDateObject,
    smallMultipleTimeSpan,
    currentInfoSensor,
    currentRegionInfo,
  } from '../../stores';
  import { addMissing, fetchTimeSlice } from '../../data/fetchData';
  import Vega from '../Vega.svelte';
  import { createSpec, patchSpec } from './vegaSpec';
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { levelMegaCounty, primaryValue } from '../../stores/constants';
  import EncodingOptions from '../EncodingOptions.svelte';
  import { trackEvent } from '../../stores/ga';
  import VegaTooltip from './VegaTooltip.svelte';
  import IoMdHelp from 'svelte-icons/io/IoMdHelp.svelte';
  import IoIosSave from 'svelte-icons/io/IoIosSave.svelte';
  import { downloadUrl } from '../../data/screenshot';

  const dispatch = createEventDispatcher();
  /**
   * @type {import('../../data/fetchData').SensorEntry}
   */
  export let sensor;

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
      }).then(addMissing)
    : [];

  $: spec = createSpec(sensor, primaryValue(sensor, $signalCasesOrDeathOptions), selections, $smallMultipleTimeSpan);

  /**
   * @param {KeyboardEvent} e
   */
  function onEscCheck(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      trackEvent('detail-view', 'close', 'keyboard');
      dispatch('close');
    }
  }

  let close = null;

  onMount(() => {
    if (close) {
      close.focus();
    }
  });

  // Reference to the vega chart component.
  let vegaRef = null;

  function downloadVega() {
    vegaRef.vegaAccessor().then((view) => {
      const pngP = view.toImageURL('png', 2);
      pngP.then((url) => {
        downloadUrl(url, `${sensor.name} in ${$currentRegionInfo ? $currentRegionInfo.displayName : 'Unknown'}.png`);
      });
    });
  }
</script>

<style>
  .single-sensor-chart {
    flex: 1 1 0;
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

  h5 {
    display: inline-block;
  }

  .header {
    position: relative;
  }

  .close {
    font-size: 0.88rem;
    position: absolute;
    right: 0;
    top: 0;
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

  .info {
    margin-left: 1em;
    font-size: 0.7rem;
    display: inline-block;
  }
</style>

<div class="header">
  <h4>{sensor.name} in {hasRegion ? selections.map((d) => d.info.displayName).join(', ') : 'Unknown'}</h4>
  <div>
    <h5>{mapTitle}</h5>
    {#if sensor.longDescription}
      <button
        title="Show sensor description"
        class="pg-button pg-button-circle info"
        on:click={() => {
          currentInfoSensor.set(sensor);
        }}><IoMdHelp /></button>
    {/if}
    <button
      title="Download this view"
      class="pg-button pg-button-circle info"
      on:click={downloadVega}
      disabled={!vegaRef}>
      <IoIosSave />
    </button>
  </div>
  <button
    bind:this={close}
    class="pg-button close"
    on:click={() => {
      trackEvent('detail-view', 'close', 'button');
      dispatch('close');
    }}
    title="Close this detail view">
    <IoIosClose />
  </button>
</div>
<div class="single-sensor-chart vega-wrapper">
  <Vega
    bind:this={vegaRef}
    {data}
    {spec}
    {patchSpec}
    {noDataText}
    signals={{ currentDate: $currentDateObject }}
    tooltip={VegaTooltip}
    tooltipProps={{ sensor }} />
</div>
{#if sensor.isCasesOrDeath}
  <div class="legend">
    <div class="legend-avg" />
    <div>7-day average</div>
    <div class="legend-avg legend-count" />
    <div>daily new COVID-19 {sensor.name.toLowerCase()}</div>
  </div>
{/if}
<div class="encoding">
  <EncodingOptions center {sensor} />
</div>
<svelte:window on:keydown={onEscCheck} />
