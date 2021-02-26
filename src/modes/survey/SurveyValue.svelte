<script>
  export let factor = 1;
  /**
   * @type {number}
   */
  export let value = null;

  export let digits = 1;

  $: scaled = value != null && !Number.isNaN(value) ? value * factor : null;

  $: hasFraction = scaled != null && Math.floor(scaled) !== scaled;
  $: base = scaled == null ? 'N/A' : Math.floor(scaled);
  $: digitsPow = Math.pow(10, digits);
  $: fraction = hasFraction ? Math.round(scaled * digitsPow) % digitsPow : 0;
</script>

<style>
  .text {
    font-size: 4rem;
    line-height: 1;
    align-self: flex-end;
    font-weight: 600;
  }
  .fraction {
    font-size: 2rem;
    line-height: 1;
    font-weight: 600;
    margin-bottom: 0.25rem;
    align-self: flex-end;
    margin-left: -0.25em;
  }

  @media only screen and (max-width: 715px) {
    .text {
      font-size: 2rem;
    }
    .fraction {
      font-size: 1rem;
      margin-bottom: 0.125rem;
    }
  }
</style>

<span class="text">{base.toLocaleString()}</span>
{#if hasFraction}<span class="fraction"> {`.${fraction}`} </span>{/if}
