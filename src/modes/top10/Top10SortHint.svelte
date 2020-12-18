<script>
  export let desc = false;
  export let sorted = false;
  export let label = '';
</script>

<style>
  .root {
    display: flex;
    cursor: pointer;
    text-align: center;
    justify-content: center;
    position: relative;
  }

  .hint {
    align-items: center;
    display: flex;
  }
</style>

<span class="root" on:click title="{label}: click to sort">
  <span class="hint" data-uk-icon={sorted ? (desc ? 'triangle-down' : 'triangle-up') : null} />
  <slot />
</span>
