<script>
  const experiments = [];

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
