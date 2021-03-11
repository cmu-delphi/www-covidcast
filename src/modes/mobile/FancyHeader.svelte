<script>
  export let sub = null;
  export let normal = false;
  export let center = false;
</script>

<h2 class="mobile-fancy-header" class:normal class:center>
  <slot />
  {#if sub}<span>{sub}</span>{/if}
</h2>

<style>
  h2.mobile-fancy-header {
    font-weight: 300;
    font-size: 1.125rem;
    letter-spacing: 0.05em;
    margin: 0.5em 0;
    text-transform: uppercase;
  }

  .normal {
    text-transform: none;
  }
  .center {
    text-align: center;
  }

  h2.mobile-fancy-header span {
    text-transform: uppercase;
    font-weight: 600;
  }

  @media only screen and (min-width: 1050px) {
    h2.mobile-fancy-header {
      font-size: 1.5rem;
    }
  }
</style>
