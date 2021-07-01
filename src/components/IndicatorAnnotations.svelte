<script>
  import { annotationManager } from '../stores';
  import { formatDateISO } from '../formats';
  import UiKitHint from './UIKitHint.svelte';
  import IndicatorAnnotation from './IndicatorAnnotation.svelte';

  /**
   * @type {import('../stores/constants').Sensor}
   */
  export let sensor;

  /**
   * @type {import("../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../stores/params").Region}
   */
  export let region = null;
  /**
   * @type {import("../stores/params").Region[]}
   */
  export let regions = [];

  export let className = '';

  /**
   * when enabled it will show annotation within the sparkline date range
   * @type {'date' | 'window' | 'sparkLine'}
   */
  export let range = 'date';

  export let asHint = false;

  /**
   * @type {import('../../data/annotations').Annotation[]}
   */
  let annotations = [];
  $: {
    if (range === 'sparkLine') {
      annotations = $annotationManager.getWindowAnnotations(
        sensor.value,
        region || regions,
        date.sparkLineTimeFrame.min,
        date.sparkLineTimeFrame.max,
      );
    } else if (range === 'window') {
      annotations = $annotationManager.getWindowAnnotations(
        sensor.value,
        region || regions,
        date.windowTimeFrame.min,
        date.windowTimeFrame.max,
      );
    } else {
      annotations = $annotationManager.getAnnotations(sensor.value, region || regions, date.value);
    }
  }

  /**
   *
   * @param annotations
   */
  function generateAnnotationSummary(annotations) {
    if (annotations.length === 0) {
      return '';
    }
    const first = annotations[0];
    return `${first.problem}<br>${formatDateISO(first.dates[0])} - ${formatDateISO(first.dates[1])}${
      annotations.length > 1 ? `<br>${annotations.length - 1} more...` : ''
    }`;
  }
</script>

{#if asHint}
  {#if annotations.length > 0}
    <UiKitHint warning title={generateAnnotationSummary(annotations)} inline color="#d46b08" {className} />
  {/if}
{:else}
  {#each annotations as annotation}
    <IndicatorAnnotation {annotation} {className} />
  {/each}
{/if}
