<script>
  import KPIValue from '../../components/KPIValue.svelte';

  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
</script>

<div class="mobile-kpi">
  <div>{region.displayName} population</div>
  <div>
    <KPIValue value={Math.round(region.value.population / 1000) * 1000} digits={0} />
  </div>
  <div class="sub">people</div>
</div>
