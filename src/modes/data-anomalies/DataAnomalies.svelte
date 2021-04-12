<script>
  import AnnotationTable from './AnnotationTable.svelte';
  import '../mobile/common.css';
</script>

<div class="root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>Data <span>Anomalies</span></h2>
    </div>
  </div>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <AnnotationTable />
    </div>
  </div>
</div>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    font-size: 0.875rem;
    line-height: 1.5rem;
  }
  .content-grid {
    grid-row-gap: 0;
  }
</style>
