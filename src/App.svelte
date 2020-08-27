<script>
  import { onMount } from 'svelte';

  import { currentMode, appReady } from './stores';
  import './stores/urlHandler';
  import './stores/ga';
  import { loadMetaData } from './data';
  import ModeToggle from './components/ModeToggle.svelte';
  import modes from './modes';

  onMount(() => {
    loadMetaData().then(() => {
      appReady.set(true);
    });
  });

  $: currentComponent = $currentMode.component();
</script>

<style>
  .mode-switcher {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5em;
    flex: 0 0 auto;
  }

  .loader {
    flex-grow: 1;
  }
</style>

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
