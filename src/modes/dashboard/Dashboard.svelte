<script lang="ts">
  import { isMobileDevice } from '../../stores';
  import '../mobile/common.css';
</script>

<div class="root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>COVIDcast <span>Dashboard</span></h2>
    </div>
  </div>
  <div class="panel">
    {#if $isMobileDevice}
      <div class="uk-alert uk-alert-warning">This view is optimized for larger screens only</div>
    {/if}
  </div>
</div>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    font-size: 0.875rem;
    line-height: 1.5rem;
  }
</style>
