<script>
  import DetailView from '../../components/DetailView/DetailView.svelte';

  import { currentSensorEntry } from '../../stores';

  let ready = null;

  function initialReady() {
    setTimeout(() => {
      ready = 'ready';
    }, 500);
  }
</script>

<style>
  .root {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
  }
</style>

<main class="root base-font-size" data-screenshot={ready}>
  <DetailView sensor={$currentSensorEntry} on:ready={initialReady} download />
</main>
