<script>
  import SignalStatusTable from './SignalStatusTable.svelte';
  import '../mobile/common.css';
</script>

<div class="mobile-root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>Signal <span>Dashboard</span></h2>
    </div>
  </div>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <SignalStatusTable />
    </div>
  </div>
</div>
