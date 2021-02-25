<script>
  import MobileWrapper from './MobileWrapper.svelte';
  import IndicatorTable from './IndicatorTable.svelte';
  import CasesOverview from './CasesOverview.svelte';
  import HighlightIndicators from './HighlightIndicators.svelte';
  import AllIndicatorOverview from './AllIndicatorOverview.svelte';
</script>

<MobileWrapper let:date let:region let:fetcher>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <CasesOverview {date} {region} {fetcher} />
      <hr />
      <AllIndicatorOverview {date} {region} {fetcher} />
      <hr />
      <HighlightIndicators {date} {region} {fetcher} />
      <hr />
      <IndicatorTable {date} {region} {fetcher} />
    </div>
  </div>
</MobileWrapper>
