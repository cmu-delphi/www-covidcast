<script>
  export let factor = 1;
  /**
   * @type {number}
   */
  export let value = null;

  export let digits = 1;

  export let loading = false;

  $: scaled = value != null && !Number.isNaN(value) ? value * factor : null;

  $: hasFraction = loading || (scaled != null && digits > 0 && Math.floor(scaled) !== scaled);
  $: base = loading ? '00' : (scaled == null ? 'N/A' : Math.floor(scaled));
  $: digitsPow = Math.pow(10, digits);
  $: fraction = !loading && hasFraction ? Math.round(scaled * digitsPow) % digitsPow : 0;
</script>

<span class="text" class:loading>{base.toLocaleString()}</span>
{#if hasFraction}<span class="fraction"> {`.${fraction}`} </span>{/if}

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
