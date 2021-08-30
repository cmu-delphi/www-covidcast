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
  import { annotationManager, getLevelInfo } from '../../stores';
  import { createEventDispatcher } from 'svelte';
  import IndicatorAnnotation from '../../components/IndicatorAnnotation.svelte';
  import { timeDay } from 'd3-time';
  import DownloadMenu from '../../components/DownloadMenu.svelte';

  const dispatch = createEventDispatcher();
  export let signal;
  export let domain;
  export let initialDate;
  export let level;

  /**
   * @type {Date}
   */
  let highlightDate = signal.latest_time_value;

  $: {
    // auto update
    highlightDate = signal.latest_time_value;
  }

  function genSpec(signal, zero, level) {
    const info = getLevelInfo(level);
    const options = {
      initialDate: highlightDate || initialDate,
      color: MULTI_COLORS[0],
      zero,
      dateField: 'date',
      valueField: 'fraction',
      isWeeklySignal: signal.isWeeklySignal,
      xTitle: signal.isWeeklySignal ? 'week' : 'day',
      title: `${info.label} Coverage of ${signal.name} Indicator`,
      subTitle: `Fraction of ${info.labelPlural}`,
      valueFormat: '.1%',
      paddingLeft: 60,
      clearHighlight: false,
      reactOnMouseMove: false,
      tickCount: {
        interval: signal.isWeeklySignal ? 'week' : 'day',
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

  $: annotations = $annotationManager.getWindowAnnotations(signal, nationInfo, domain.min, domain.max);
  $: spec = injectRanges(genSpec(signal, !zoom, level), domain, annotations);

  export let data;
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
