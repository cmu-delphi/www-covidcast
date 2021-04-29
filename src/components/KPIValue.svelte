<script>
  import KPI from './KPI.svelte';

  export let factor = 1;
  /**
   * @type {number}
   */
  export let value = null;

  export let digits = 1;

  export let loading = false;

  $: scaled = value != null && !Number.isNaN(value) ? value * factor : null;

  $: hasFraction = loading || (scaled != null && digits > 0 && Math.floor(scaled) !== scaled);
  $: base = loading ? '00' : scaled == null ? 'N/A' : Math.floor(scaled);
  $: digitsPow = Math.pow(10, digits);
  $: fraction = !loading && hasFraction ? Math.round(scaled * digitsPow) % digitsPow : 0;
</script>

<KPI text={base.toLocaleString()} sub={hasFraction ? `.${fraction}` : null} {loading} />
