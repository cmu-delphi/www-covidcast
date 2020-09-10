<script>
  import { createEventDispatcher } from 'svelte';
  import Search from '../../components/Search.svelte';
  import { currentSensorEntry, recentRegionInfos } from '../../stores';
  import { levelMegaCounty } from '../../stores/constants';

  const dispatch = createEventDispatcher();

  export let regionSearchList;
  // bi-directional mapping
  export let pickMapMode = false;

  export let selections = [];

  $: infosWithoutMega = regionSearchList.filter(
    (d) => d.level !== levelMegaCounty.id && !selections.some((s) => s === d),
  );
</script>

<style>

</style>

<section class="container-bg container-style">
  <h4>Add Another...</h4>

  <h5>Search by name</h5>
  <Search
    className=""
    placeholder="Search..."
    selectedItem={null}
    items={infosWithoutMega}
    labelFieldName="displayName"
    maxItemsToShowInList="5"
    on:change={(e) => {
      dispatch('add', e.detail);
    }} />

  <h5>
    <button on:click={() => (pickMapMode = !pickMapMode)}>Select on map</button>
  </h5>

  <h5>Select from recent locations</h5>
  <ul>
    {#each $recentRegionInfos as info}
      <li>{info.displayName}</li>
    {/each}
  </ul>

  <h5>
    Select from Top for
    <span>{$currentSensorEntry.name}</span>
  </h5>
  TODO
</section>
