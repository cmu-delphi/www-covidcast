<script>
  const experiments = [
    {
      name: 'LineAndMap',
      component: () => import('./LineAndMap.svelte').then((r) => r.default),
    },
    {
      name: 'State Map',
      component: () => import('./StateMap.svelte').then((r) => r.default),
    },
    {
      name: 'VegaMap',
      component: () => import('./VegaMap.svelte').then((r) => r.default),
    },
    {
      name: 'DataJournalistChart',
      component: () => import('./DataJournalistChart.svelte').then((r) => r.default),
    },
  ];

  let selected = 0;
  $: currentComponent = experiments[selected].component();
</script>

<style>
</style>

Experiments:
<select bind:value={selected}>
  {#each experiments as ex, i}
    <option value={i}>{ex.name}</option>
  {/each}
</select>

{#await currentComponent}
  <div class="loader loading" />
{:then value}
  <svelte:component this={value} />
{:catch error}
  <div class="loader">
    Error loading current experiment
    <pre>{error}</pre>
  </div>
{/await}
