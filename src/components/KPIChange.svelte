<script>
  import KPI from './KPI.svelte';
  import { sign } from '../formats';

  /**
   * @type {number}
   */
  export let value = null;
  export let loading = false;
  export let asterisk = false;

  $: scaled = value != null && !Number.isNaN(value) ? value * 100 : null;

  $: base = loading ? '00' : scaled == null ? 'N/A' : Math.floor(scaled);
  $: fraction = !loading ? Math.round(Math.abs(scaled) * 100) % 100 : 0;
</script>

{#if scaled == null}
  <KPI text={base.toString()} {loading} />
{:else}
  <KPI text={sign(base, (v) => v.toLocaleString(), true)} sub={`.${fraction}%`} {loading} {asterisk} />
{/if}
