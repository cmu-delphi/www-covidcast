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
    (d) =>
      d.level !== levelMegaCounty.id &&
      !selections.some((s) => s.info.id === d.id) &&
      (selections.length === 0 || selections.some((s) => s.info.level === d.level)), // filter to same level as selection
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
    text-align: center;
    margin: 0.5em 0;
  }

  ol,
  ul {
    flex: 1 1 0;
    overflow: auto;
  }

  ol {
    flex: 2 1 0;
  }
</style>

<section class="container-bg container-style root">
  <h4>Add Another</h4>

  <Search
    className="container-bg"
    placeholder="Search by name..."
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
    class="uk-button uk-button-default uk-button-small uk-width-1-1 uk-margin-top"
    class:selected={pickMapMode}
    aria-pressed={pickMapMode}
    on:click={() => (pickMapMode = !pickMapMode)}>
    Select on map
  </button>

  <h5>Select from Top for <strong>{$currentSensorEntry.name}</strong></h5>

  <ol class:loading>
    {#each top10Data as row}
      <li>
        <a
          href="?region={row.info ? row.info.propertyId : ''}"
          class="uk-link-text"
          disabled={!row.info || selections.some((d) => d.info.id === row.info.id)}
          on:click|preventDefault={() => dispatch('add', row.info)}>
          {row.displayName} ({$currentSensorEntry.formatValue(row.value)})
        </a>
      </li>
    {/each}
  </ol>

  {#if possibleRecent.length > 0}
    <h5>Select from recent locations</h5>
    <ul>
      {#each possibleRecent.reverse() as info}
        <li>
          <a
            href="?region={info.propertyId}"
            class="uk-link-text"
            on:click|preventDefault={() => dispatch('add', info)}>{info.displayName}</a>
        </li>
      {/each}
    </ul>
  {/if}
</section>
