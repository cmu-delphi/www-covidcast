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
      name: 'County Related',
      component: () => import('./CountyRelated.svelte').then((r) => r.default),
    },
    {
      name: 'State Distribution',
      component: () => import('./StateDistribution.svelte').then((r) => r.default),
    },
    {
      name: 'LineAndTileMap',
      component: () => import('./LineAndTileMap.svelte').then((r) => r.default),
    },
    {
      name: 'LineAndGapMinder',
      component: () => import('./LineAndGapMinder.svelte').then((r) => r.default),
    },
    {
      name: 'LineAndThermalPlot',
      component: () => import('./LineAndThermalPlot.svelte').then((r) => r.default),
    },
    {
      name: 'StateMatrix',
      component: () => import('./StateMatrix.svelte').then((r) => r.default),
    },
    {
      name: 'StateHTMLMatrix',
      component: () => import('./StateHTMLMatrix.svelte').then((r) => r.default),
    },
    {
      name: 'Parallel Coodinates Plot',
      component: () => import('./PCP.svelte').then((r) => r.default),
    },
  ];

  let selected = Number.parseInt(new URL(window.location.href).searchParams.get('lab') || '0', 10);
  $: currentComponent = experiments[selected].component();

  $: {
    const u = new URL(window.location.href);
    u.searchParams.set('lab', selected);
    history.replaceState(null, null, u.href);
  }
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
