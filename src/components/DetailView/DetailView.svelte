<script>
  import { signalCasesOrDeathOptions, currentDateObject, smallMultipleTimeSpan, currentInfoSensor } from '../../stores';
  import { addMissing, fetchTimeSlice } from '../../data/fetchData';
  import Vega from '../Vega.svelte';
  import { createSpec, patchSpec } from './vegaSpec';
  import { createEventDispatcher, onMount } from 'svelte';
  import { levelMegaCounty, primaryValue } from '../../stores/constants';
  import EncodingOptions from '../EncodingOptions.svelte';
  import { trackEvent } from '../../stores/ga';
  import VegaTooltip from './VegaTooltip.svelte';
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
      }).then((rows) => addMissing(rows, sensor))
    : [];

  const title = `${sensor.name} in ${
    selections.length > 0 ? selections.map((d) => d.info.displayName).join(', ') : 'Unknown'
  }`;

  $: spec = createSpec(sensor, primaryValue(sensor, $signalCasesOrDeathOptions), selections, $smallMultipleTimeSpan, [
    title,
    mapTitle,
  ]);

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
  {#if sensor.description}
    <button
      title="Show sensor description"
      class="uk-icon-button"
      data-uk-icon="icon: question-plain"
      data-uk-toggle="target: #info-dialog"
      on:click={() => {
        currentInfoSensor.set(sensor);
      }} />
  {/if}
  <button
    bind:this={close}
    class="uk-icon-button"
    data-uk-close
    on:click={() => {
      trackEvent('detail-view', 'close', 'button');
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
