<script>
  import IoMdArrowDropup from 'svelte-icons/io/IoMdArrowDropup.svelte';
  import IoMdArrowDropdown from 'svelte-icons/io/IoMdArrowDropdown.svelte';
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
    width: 1em;
  }
</style>

<span class="root" on:click title="{label}: click to sort">
  <span class="hint">
    {#if sorted}
      {#if desc}
        <IoMdArrowDropdown />
      {:else}
        <IoMdArrowDropup />
      {/if}
    {/if}
  </span>
  <slot />
</span>
