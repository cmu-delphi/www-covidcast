<script>
  import IoIosArrowForward from 'svelte-icons/io/IoIosArrowForward.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let collapsed = false;

  function toggleCollapsed() {
    collapsed = !collapsed;
    dispatch('collapse', collapsed);
  }
</script>

<style>
  li {
    margin: 0;
  }

  .header {
    display: flex;
    align-items: center;
    padding-bottom: 0.2em;
    cursor: pointer;
  }

  .toggle {
    width: 1.2em;
    height: 1.2em;
    position: relative;
    transition: transform 0.25s ease;
    transform: rotate(90deg);
  }

  .collapsed {
    padding-bottom: 0;
  }
  .collapsed .toggle {
    transform: rotate(0deg);
  }
  .collapsed > .collapsed-body {
    display: none;
  }
</style>

<li class:collapsed>
  <div class="header" on:click={toggleCollapsed} aria-label="toggle collapse state">
    <span class="toggle">
      <IoIosArrowForward />
    </span>
    <slot name="header" {collapsed} />
    <slot name="toolbar" {collapsed} />
  </div>
  <div class="collapsed-body">
    <slot {collapsed} />
  </div>
</li>
