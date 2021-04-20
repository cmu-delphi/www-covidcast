<script>
  import { onMount } from 'svelte';
  import { currentMode, appReady, sensorList, loadAnnotations } from './stores';
  import './stores/urlHandler';
  import './stores/ga';
  import './stores/websiteInjector';
  import { loadMetaData } from './data';
  import Disclaimer from './components/Disclaimer.svelte';

  onMount(() => {
    Promise.all([loadMetaData(sensorList), loadAnnotations()]).then(() => {
      appReady.set(true);
      document.body.dataset.ready = 'ready';
    });
  });

  $: currentComponent = $currentMode.component();
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
