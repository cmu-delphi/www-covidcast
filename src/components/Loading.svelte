<script>
  import { currentDataReadyOnMap } from '../stores';
</script>

<style>
  .loader {
    min-width: 28px;
    min-height: 28px;
  }
</style>

{#if $currentDataReadyOnMap}
  <div class="loader loading" />
{/if}
