<script>
  import chevronDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
  import chevronUpIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-up.svg';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let label;
  export let sorted = false;
  export let desc = false;
</script>

<style>
  .sort-indicator {
    border: none;
    background: none;
    font-weight: inherit;
    text-transform: uppercase;
    color: inherit;
    opacity: 0.4;
    padding: 0;
    cursor: pointer;
  }

  .sort-indicator:hover,
  .sort-indicator.active {
    opacity: 1;
  }
</style>

<span>
  <button
    class="inline-svg-icon sort-indicator"
    class:active={sorted}
    on:click={() => dispatch('click')}
    title="Sort {label} {desc ? 'ascending' : 'descending'}">
    {#if sorted && desc}
      {@html chevronDownIcon}
    {:else}
      {@html chevronUpIcon}
    {/if}
  </button>
</span>
