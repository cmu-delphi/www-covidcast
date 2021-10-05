<script>
  import KPI from './KPI.svelte';
  import { sign } from '../formats';

  /**
   * @type {number}
   */
  export let value = null;
  export let loading = false;

  $: scaled = value != null && !Number.isNaN(value) ? value * 100 : null;

  $: base = loading ? '00' : scaled == null ? 'N/A' : Math.floor(scaled);
  $: fraction = !loading ? Math.round(Math.abs(scaled)) % 100 : 0;
</script>

<KPI text={sign(base, (v) => v.toLocaleString(), true)} sub={`.${fraction}%`} {loading} />
