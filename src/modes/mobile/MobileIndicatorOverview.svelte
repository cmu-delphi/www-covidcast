<script>
  import MobileWrapper from './MobileWrapper.svelte';
  import GeoTable from './GeoTable.svelte';
  import IndicatorOverview from './IndicatorOverview.svelte';
</script>

<MobileWrapper let:params let:sensor>
  <IndicatorOverview {sensor} {params} />
  <hr />
  <GeoTable {sensor} {params} />
</MobileWrapper>
