<script>
  import KPI from './KPI.svelte';

  export let factor = 1;
  /**
   * @type {number}
   */
  export let value = null;

  export let digits = 1;

  export let loading = false;

  export let asterisk = false;

  $: scaled = value != null && !Number.isNaN(value) ? value * factor : null;
  $: digitsPow = Math.pow(10, digits);
  $: roundedValue = Math.round(Math.abs(scaled) * digitsPow);

  $: hasFraction = loading || (scaled != null && digits > 0 && Math.floor(scaled) !== scaled);
  $: base = loading ? '00' : scaled == null ? 'N/A' : Math.floor(roundedValue / digitsPow);
  $: fraction = !loading && hasFraction ? roundedValue % digitsPow : 0;
</script>

<KPI text={base.toLocaleString()} sub={hasFraction ? `.${fraction}` : null} {loading} {asterisk} />
