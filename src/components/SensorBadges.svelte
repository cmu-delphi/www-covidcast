<script>
  import { metaDataManager } from '../stores';
  import { sensorTypes } from '../data/sensor';
  import SourceBadges from './SourceBadges.svelte';

  /**
   * @type {import("../stores/params").Sensor | null}
   */
  export let sensor = null;

  export let source = true;

  $: meta = sensor && sensor.key ? $metaDataManager.getMetaData(sensor.key) : null;
</script>

{#if source}
  <SourceBadges source={sensor ? $metaDataManager.getSource(sensor) : null} />
{/if}
{#if meta}
  <span class="uk-badge signal-badge" title={sensor.name}>api: {meta.signal}</span>
  <span
    class="uk-badge category-badge"
    data-cat={meta.category}
    title={(sensorTypes.find((d) => d.id == meta.category) || { label: meta.category }).label}
    >category: {meta.category}</span
  >
  {#if meta.format !== 'raw'}
    <span class="uk-badge format-badge" data-format={meta.format} title={sensor.unit}
      >format: {meta.format === 'raw_count' ? 'count' : meta.format}</span
    >
  {/if}
  {#if meta.is_smoothed}
    <span class="uk-badge is-smooth" title="uses a trailing average">smoothed</span>
  {/if}
  {#if meta.is_cumulative}
    <span class="uk-badge is-cumulative" title="is a cumulative signal">cumulative</span>
  {/if}
  {#if meta.is_weighted}
    <span class="uk-badge is-weighted" title="is a weighted signal">weighted</span>
  {/if}
  {#if meta.has_stderr}
    <span class="uk-badge has-stderr" title="includes standard error information">stderr</span>
  {/if}
  {#if meta.has_sample_size}
    <span class="uk-badge has-sample-size" title="includes sample size information">sample size</span>
  {/if}
{/if}

<style>
  .uk-badge {
    color: #666;
    font-size: 0.625rem;
  }
  .signal-badge {
    color: white;
  }
  .category-badge[data-cat='public'] {
    background: #fee6ce;
  }
  .category-badge[data-cat='early'] {
    background: #fdae6b;
  }
  .category-badge[data-cat='late'] {
    background: #e6550d;
    color: white;
  }
  .category-badge[data-cat='other'] {
    background: #bab0ab;
    color: white;
  }
  .format-badge[data-format='fraction'] {
    background: #f2f0f7;
  }
  .format-badge[data-format='percent'] {
    background: #cbc9e2;
  }
  .format-badge[data-format='per100k'] {
    background: #9e9ac8;
    color: white;
  }
  .format-badge[data-format='raw'],
  .format-badge[data-format='raw_count'] {
    background: #6a51a3;
    color: white;
  }

  .is-smooth {
    background: #e15759;
    color: white;
  }
  .is-cumulative {
    background: #9c755f;
    color: white;
  }
  .is-weighted {
    background: #fb8072;
    color: white;
  }
  .has-stderr {
    background: #bab0ab;
    color: white;
  }
  .has-sample-size {
    background: #bab0ab;
    color: white;
  }
</style>
