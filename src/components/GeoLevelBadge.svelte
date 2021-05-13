<script>
  import { getLevelInfo } from '../stores';

  /**
   * @type {import("../stores/params").Region | null}
   */
  export let region = null;

  $: info = region && region.level ? getLevelInfo(region.level) : null;
</script>

{#if info}
  <span class="uk-badge" style="background: {info.color}" title={info.label}>{info.id}</span>
{/if}

<style>
  .uk-badge {
    color: white;
  }
</style>
