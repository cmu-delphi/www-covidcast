<script>
  import SurveyValue from '../survey/SurveyValue.svelte';

  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
</script>

<div class="mobile-kpi">
  <div>{region.displayName} population</div>
  <div>
    <SurveyValue value={Math.round(region.value.population / 1000) * 1000} digits={0} />
  </div>
  <div class="sub">people</div>
</div>
