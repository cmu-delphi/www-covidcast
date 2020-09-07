<script>
  import DetailView from '../../components/DetailView/DetailView.svelte';

  import { currentMode, currentSensorEntry } from '../../stores';
  import SmallMultiplesPanel from '../overview/SmallMultiplesPanel.svelte';

  let ready = null;

  function initialReady() {
    setTimeout(() => {
      ready = 'nested';
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
  {#if $currentMode.id === 'screenshot-detail'}
    <DetailView sensor={$currentSensorEntry} on:ready={initialReady} download />
  {:else}
    <SmallMultiplesPanel detail={$currentSensorEntry} on:ready={initialReady} download />
  {/if}
</main>
