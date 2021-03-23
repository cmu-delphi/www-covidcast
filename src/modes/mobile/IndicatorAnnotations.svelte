<script>
  import { annotationManager } from '../../stores';
  import warningIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
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

  $: annotations = $annotationManager.getAnnotations(sensor.value, region.value, date.value);
</script>

{#each annotations as annotation}
  <div class="uk-alert uk-alert-warning">
    <h5 class="alert-header">
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
