<script>
  import MobileWrapper from './MobileWrapper.svelte';
  import IndicatorTable from './IndicatorTable.svelte';
  import CasesOverview from './CasesOverview.svelte';
  import HighlightIndicators from './HighlightIndicators.svelte';
  import AllIndicatorOverview from './AllIndicatorOverview.svelte';
</script>

<MobileWrapper let:date let:region>
  <CasesOverview {date} {region} />
  <hr />
  <AllIndicatorOverview {date} {region} />
  <hr />
  <HighlightIndicators {date} {region} />
  <hr />
  <IndicatorTable {date} {region} />
</MobileWrapper>
