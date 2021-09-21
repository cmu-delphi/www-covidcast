<script>
  import { onMount } from 'svelte';
  import { currentMode, appReady, loadMetaData, loadAnnotations } from './stores';
  import './stores/urlHandler';
  import './stores/ga';
  import './stores/websiteInjector';
  import Disclaimer from './components/Disclaimer.svelte';

  let markReady = () => false;
  const appReadyPromise = new Promise((resolve) => {
    markReady = resolve;
  });

  onMount(() => {
    Promise.all([loadMetaData(), loadAnnotations()]).then(() => {
      appReady.set(true);
      markReady();
      document.body.dataset.ready = 'ready';
    });
  });

  async function loadComponent(mode) {
    await appReadyPromise;
    return mode.component();
  }

  $: currentComponent = loadComponent($currentMode);
</script>

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
<Disclaimer />

<style>
  .loader {
    flex-grow: 1;
  }
</style>
