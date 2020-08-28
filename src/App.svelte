<script>
  import { onMount } from 'svelte';

  import { currentMode, appReady } from './stores';
  import './stores/urlHandler';
  import './stores/ga';
  import { loadMetaData } from './data';

  onMount(() => {
    loadMetaData().then(() => {
      appReady.set(true);
    });
  });

  $: currentComponent = $currentMode.component();
</script>

<style>
  .loader {
    flex-grow: 1;
  }
</style>

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
