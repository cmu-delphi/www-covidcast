<script>
  import { currentInfoSensor } from '../stores';

  /**
   * @type {import("../stores/constants").SensorEntry}
   */
  export let sensor;
  export let large = false;
  export let className = '';
</script>

{#if sensor != null && sensor.description}
  <button
    title="Show sensor description"
    class="uk-icon-button {className}"
    class:uk-icon-button-small={!large}
    data-uk-toggle="target: #info-dialog"
    data-uk-icon="icon: question-plain"
    on:click|stopPropagation={() => {
      currentInfoSensor.set(sensor);
    }}
  />
{/if}
