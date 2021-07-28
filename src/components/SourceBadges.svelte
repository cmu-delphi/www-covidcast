<script>
  import { KNOWN_LICENSES } from '../data/api';

  /**
   * @type {import("../data/meta").SensorSource | null}
   */
  export let source = null;

  $: knownLicense = source ? KNOWN_LICENSES[source.license] : null;
</script>

{#if source}
  <span class="uk-badge source-badge" title={source.dataSourceName}>{source.source}</span>
  {#if knownLicense}
    <a class="uk-badge license-badge" title={knownLicense.name} href={knownLicense.href}
      >{source.license.toLowerCase()} license</a
    >
  {:else}
    <span class="uk-badge license-badge" title={source.license}>custom license</span>
  {/if}
{/if}

<style>
  .uk-badge {
    color: #666 !important;
    font-size: 0.625rem;
  }
  .source-badge {
    color: white !important;
  }
  .license-badge {
    background: #9e9e9e;
    color: white !important;
  }
</style>
