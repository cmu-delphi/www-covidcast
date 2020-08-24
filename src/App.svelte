<script>
  import { onMount } from 'svelte';
  import { currentMode, appReady, sensorList } from './stores';
  import './stores/urlHandler';
  import './stores/ga';
  import { loadMetaData } from './data';
  import ModeToggle from './components/ModeToggle.svelte';
  import modes from './modes';

  onMount(() => {
    loadMetaData(sensorList).then(() => {
      appReady.set(true);
    });
  });

  $: currentComponent = $currentMode.component();
</script>

<style>
  .root {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }

  .mode-switcher {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5em;
  }

  .loader {
    flex-grow: 1;
  }
</style>

<div class="root">
  {#if modes.length > 1}
    <div class="mode-switcher">
      <ModeToggle />
    </div>
  {/if}
  {#await currentComponent}
    <div class="loader loading" />
  {:then value}
    <svelte:component this={value} />
  {:catch error}
    <div class="loader">
      Error loading current mode
      <pre>{error}</pre>
    </div>
  {/await}
</div>
