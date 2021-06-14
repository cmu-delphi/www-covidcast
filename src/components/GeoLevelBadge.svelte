<script>
  import { getLevelInfo } from '../stores';

  /**
   * @type {import("../stores/params").Region | null}
   */
  export let region = null;
  /**
   * @type {import("../stores/params").RegionLevel | null}
   */
  export let level = null;

  $: info = region && region.level ? getLevelInfo(region.level) : level ? getLevelInfo(level) : null;
</script>

{#if info}
  <span class="uk-badge" style="background: {info.color}" title={info.label}>{info.id}</span>
{/if}

<style>
  .uk-badge {
    color: white;
    font-size: 0.625rem;
  }
</style>
