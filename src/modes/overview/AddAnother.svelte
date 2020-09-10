<script>
  import { createEventDispatcher } from 'svelte';
  import Search from '../../components/Search.svelte';
  import { getInfoByName } from '../../maps';
  import { currentSensorEntry, recentRegionInfos } from '../../stores';
  import { levelMegaCounty } from '../../stores/constants';

  const dispatch = createEventDispatcher();

  export let mapData;
  export let regionSearchList;
  // bi-directional mapping
  export let pickMapMode = false;

  export let selections = [];

  $: possibleInfos = regionSearchList.filter(
    (d) => d.level !== levelMegaCounty.id && !selections.some((s) => s.info.id === d.id),
  );

  $: possibleRecent = $recentRegionInfos.filter((d) => !selections.some((s) => s.info.id === d.id));

  let loading = true;
  let top10Data = [];

  $: {
    loading = true;
    mapData.then((r) => {
      loading = false;
      top10Data = r
        .map((row) => {
          const info = getInfoByName(row.geo_value);
          return {
            displayName: info ? info.displayName : row.geo_value,
            info,
            ...row,
          };
        })
        .sort((a, b) => {
          if (a.value !== b.value) {
            return a.value < b.value ? 1 : -1;
          }
          return a.displayName.localeCompare(b.displayName);
        })
        .slice(0, 10);
    });
  }
</script>

<style>
  .root {
    flex: 1 1 0;
    margin-bottom: 6px;
    display: flex;
    flex-direction: column;
  }

  h4 {
    font-size: 1.2em;
  }

  h5 {
    padding: 0.5em 0;
  }

  .current {
    text-decoration: underline;
  }

  ol,
  ul {
    flex: 1 1 0;
    overflow: auto;
  }

  ul.empty {
    flex: 0 0 auto;
  }

  ol {
    flex: 2 1 0;
  }

  li {
    padding: 0;
  }

  ul > li {
    list-style-position: inherit;
  }

  ol > li {
    margin-left: 2em;
  }

  .button {
    line-height: 1;
    cursor: pointer;
    text-decoration: none;
    background: none !important;
    margin: 0;
    padding: 0;
    color: inherit;
  }

  .button:disabled {
    cursor: not-allowed;
  }

  .button:focus {
    outline: none;
  }
</style>

<section class="container-bg container-style root">
  <h4>Add Another...</h4>

  <h5>Search by name</h5>
  <Search
    className="container-bg"
    placeholder="Search..."
    selectedItem={possibleInfos ? null : null}
    items={possibleInfos}
    labelFieldName="displayName"
    maxItemsToShowInList="5"
    on:change={(e) => {
      if (e.detail) {
        dispatch('add', e.detail);
      }
    }} />

  <button
    class="pg-button pg-text-button"
    class:selected={pickMapMode}
    aria-pressed={pickMapMode}
    on:click={() => (pickMapMode = !pickMapMode)}>
    Select on map
  </button>

  <h5>Select from recent locations</h5>
  <ul class:empty={possibleRecent.length === 0}>
    {#each possibleRecent as info}
      <li>
        <button class="button" on:click={() => dispatch('add', info)}>{info.displayName}</button>
      </li>
    {/each}
    {#if possibleRecent.length === 0}
      <li>No recent locations founds</li>
    {/if}
  </ul>
  <h5>
    Select from Top for
    <span class="current">{$currentSensorEntry.name}</span>
  </h5>

  <ol class:loading>
    {#each top10Data as row}
      <li>
        <button
          class="button"
          disabled={!row.info || selections.some((d) => d.info.id === row.info.id)}
          on:click={() => dispatch('add', row.info)}>
          {row.displayName} ({$currentSensorEntry.formatValue(row.value)})
        </button>
      </li>
    {/each}
  </ol>
</section>
