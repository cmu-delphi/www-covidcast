<script>
  import MobileWrapper from './MobileWrapper.svelte';
  import IndicatorTable from './IndicatorTable.svelte';
  import CasesOverview from './CasesOverview.svelte';
  import HighlightIndicators from './HighlightIndicators.svelte';
</script>

<MobileWrapper let:params>
  <CasesOverview {params} />
  <hr />
  <HighlightIndicators {params} />
  <hr />
  <IndicatorTable {params} />
</MobileWrapper>
