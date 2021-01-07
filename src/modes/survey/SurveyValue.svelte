<script>
  import { factor } from './questions';
  /**
   * @type {number}
   */
  export let value = null;

  $: scaled = value != null && !Number.isNaN(value) ? value * factor : null;

  $: hasFraction = scaled != null && Math.round(scaled) !== scaled;
  $: base = scaled == null ? 'N/A' : Math.round(scaled);
  $: fraction = hasFraction ? Math.round(scaled * 10) % 10 : 0;
</script>

<style>
  .text {
    font-size: 4rem;
    font-weight: 700;
  }
  .fraction {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 2px;
    align-self: flex-end;
  }
</style>

<span class="text">{base}</span>
{#if hasFraction}<span class="fraction"> {`.${fraction}`} </span>{/if}
