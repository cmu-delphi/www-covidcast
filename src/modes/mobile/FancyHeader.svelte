<script>
  export let sub = null;
  export let normal = false;
</script>

<style>
  .mobile-fancy-header {
    font-size: 18px;
    font-weight: 600;
    line-height: 2rem;
    letter-spacing: 0.05em;
    margin: 0.5em 0 0 0;
    text-transform: uppercase;
  }

  .normal {
    text-transform: none;
  }

  .mobile-fancy-header span {
    text-transform: uppercase;
    font-weight: 300;
  }
</style>

<h2 class="mobile-fancy-header" class:normal>
  <slot />
  {#if sub}<span>{sub}</span>{/if}
</h2>
