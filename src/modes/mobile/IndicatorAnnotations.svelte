<script>
  import { annotationManager } from '../../stores';
  import warningIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
  import { formatDateISO } from '../../formats';
  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;

  /**
   * when enabled it will show annotation within the sparkline date range
   */
  export let sparkLine = false;
  /**
   * when enabled it will show annotation within the window date range
   */
  export let window = false;

  /**
   * @type {import('../../data/annotations').Annotation[]}
   */
  let annotations = [];
  $: {
    if (window) {
      annotations = $annotationManager.getWindowAnnotations(
        sensor.value,
        region.value,
        date.sparkLineTimeFrame.min,
        date.sparkLineTimeFrame.max,
      );
    } else if (sparkLine) {
      annotations = $annotationManager.getWindowAnnotations(
        sensor.value,
        region.value,
        date.windowTimeFrame.min,
        date.windowTimeFrame.max,
      );
    } else {
      annotations = $annotationManager.getAnnotations(sensor.value, region.value, date.value);
    }
  }
</script>

{#each annotations as annotation}
  <div class="uk-alert uk-alert-warning">
    <h5 class="alert-header">
      {formatDateISO(annotation.dates[0])} - {formatDateISO(annotation.dates[1])}
      <span class="inline-svg-icon">
        {@html warningIcon}
      </span>
      {annotation.problem}
    </h5>
    <p>
      {annotation.explanation}
    </p>
  </div>
{/each}

<style>
  .alert-header {
    font-weight: 600;
    margin: 0;
  }
</style>
