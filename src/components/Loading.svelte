<script>
  export let loading = false;
</script>

<style>
  .loader {
    min-width: 28px;
    min-height: 28px;
    overflow: hidden;
  }
</style>

{#if loading}
  <div class="loader loading" />
{/if}
