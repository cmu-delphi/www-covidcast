<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { nationInfo } from '../../data/regions';
  import {
    generateLineChartSpec,
    resolveHighlightedDate,
    patchHighlightTuple,
    MULTI_COLORS,
    genAnnotationLayer,
  } from '../../specs/lineSpec';
  import Toggle from '../../components/Toggle.svelte';
  import { annotationManager } from '../../stores';
  import { createEventDispatcher } from 'svelte';
  import IndicatorAnnotation from '../../components/IndicatorAnnotation.svelte';
  import { timeDay } from 'd3-time';
  import DownloadMenu from '../../components/DownloadMenu.svelte';

  const dispatch = createEventDispatcher();
  /**
   * @type {import('./data').ExtendedStatus}
   */
  export let signal;

  /**
   * @type {import('../../stores/params').TimeFrame}
   */
  export let domain;

  /**
   * @type {Date}
   */
  let highlightDate = signal.latest_time_value;

  $: {
    // auto update
    highlightDate = signal.latest_time_value;
  }

  /**
   * @param {import('./data').ExtendedStatus} signal
   */
  function genSpec(signal, domain, zero) {
    const options = {
      initialDate: highlightDate || signal.latest_time_value,
      color: MULTI_COLORS[0],
      domain: domain.domain,
      zero,
      dateField: 'date',
      valueField: 'fraction',
      xTitle: 'Date',
      title: `County Coverage of ${signal.name} Indicator`,
      subTitle: 'Fraction of Counties',
      valueFormat: '.1%',
      paddingLeft: 60,
      clearHighlight: false,
      reactOnMouseMove: false,
      tickCount: {
        interval: 'day',
      },
    };
    return generateLineChartSpec(options);
  }

  function onSignal(event) {
    if (event.detail.name === 'highlight') {
      const date = resolveHighlightedDate(event, 'date');
      if (highlightDate !== date && highlightDate != null && date != null && timeDay.count(highlightDate, date) !== 0) {
        dispatch('highlight', date);
      }
      highlightDate = date;
    }
  }

  function injectRanges(spec, domain, annotations) {
    if (annotations.length > 0) {
      spec.layer.unshift(genAnnotationLayer(annotations, domain));
    }
    return spec;
  }

  let zoom = false;

  $: annotations = $annotationManager.getWindowAnnotations(
    { id: signal.source, signal: signal.covidcast_signal },
    nationInfo,
    domain.min,
    domain.max,
  );
  $: spec = injectRanges(genSpec(signal, domain, !zoom), domain, annotations);
  $: data = signal.coverage.county || [];
  // $: fileName = `${signal.name}_coverage`;

  let vegaRef = null;
</script>

<Vega
  bind:this={vegaRef}
  {spec}
  {data}
  signals={{ highlight_tuple: patchHighlightTuple }}
  signalListeners={['highlight']}
  on:signal={onSignal}
/>

<div class="buttons">
  <Toggle bind:checked={zoom}>Rescale Y-axis</Toggle>
  <div class="spacer" />
  <DownloadMenu fileName="{signal.name}_coverage" {vegaRef} {data} prepareRow={(row) => row} />
</div>

{#each annotations as annotation}
  <IndicatorAnnotation {annotation} />
{/each}

<style>
  .buttons {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .spacer {
    flex: 1 1 0;
  }
</style>
