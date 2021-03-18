<script>
  export let sub = null;
  export let normal = false;
  export let center = false;
  export let invert = false;
  export let anchor = null;
</script>

<h2 class="mobile-fancy-header" class:normal class:center class:invert>
  {#if anchor}
    <a href="#{anchor}" id={anchor} class="anchor"><span aria-hidden="true">Anchor</span></a>
  {/if}
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
    position: relative;
  }

  .normal {
    text-transform: none;
  }
  .center {
    text-align: center;
  }

  h2.mobile-fancy-header.invert {
    font-weight: 600;
  }
  h2.mobile-fancy-header.invert span {
    text-transform: uppercase;
    font-weight: 300;
  }

  h2.mobile-fancy-header:not(.invert) span {
    text-transform: uppercase;
    font-weight: 600;
  }

  @media only screen and (min-width: 1050px) {
    h2.mobile-fancy-header {
      font-size: 1.5rem;
    }
  }

  .anchor {
    /** move anchor such that scrolling won't overlap with the sticky parameters */
    position: absolute;
    top: -160px;
    display: inline-block;
  }
</style>
