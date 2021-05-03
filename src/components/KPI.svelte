<script>
  /**
   * @type {string}
   */
  export let text = null;
  /**
   * @type {string}
   */
  export let sub = null;

  export let loading = false;
</script>

<span class="text" class:loading>{text || 'N/A'}</span>
{#if sub}<span class="fraction">{sub}</span>{/if}

<style>
  .text {
    font-size: 1.5rem;
    line-height: 1;
    align-self: flex-end;
    font-weight: 600;
  }
  .fraction {
    font-size: 1rem;
    margin-bottom: 0.125rem;
    line-height: 1;
    font-weight: 600;
    align-self: flex-end;
    margin-left: -0.15em;
  }

  @media only screen and (min-width: 750px) {
    .text {
      font-size: 2rem;
    }
    .fraction {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }
  }
</style>
