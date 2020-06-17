<script>
  import { onMount, getContext } from 'svelte';
  import { currentLevel, currentDataReadyOnMap } from './stores.js';
  import AutoComplete from 'simple-svelte-autocomplete';
  import {} from './util.js';
  import * as d3 from 'd3';

  //const { getMap } = getContext(key);
  //$: if (getMap()) {
  //  console.log(getMap());
  // }

  //console.log(getMap);
  //const map = getMap();
  let state_lst = [];
  let county_lst = [];
  let msa_lst = [];

  let selectedRegion;
  $: region_lst = [];
  $: loaded = false;

  //onMount(_ => {
  Promise.all([d3.json('./maps/name_id_info.json')]).then(([a]) => {
    state_lst = a['state'];
    county_lst = a['county'];
    msa_lst = a['msa'];
    if ($currentLevel === 'county') {
      region_lst = county_lst;
    } else if ($currentLevel === 'state') {
      region_lst = state_lst;
    } else {
      region_lst = msa_lst;
    }
    loaded = true;
  });
  //});

  currentLevel.subscribe(s => {
    if (s === 'county') {
      region_lst = county_lst;
    } else if (s === 'state') {
      region_lst = state_lst;
    } else {
      region_lst = msa_lst;
    }
  });
</script>

<style>

</style>

{#if loaded && region_lst.length != 0}
  <div class="search">
    <AutoComplete
      items={region_lst}
      bind:selectedItem={selectedRegion}
      labelFieldName="name"
      keywordsFunction={place => place.name}
      maxItemsToShowInList="4"
      onChange={() => {
        console.log(selectedRegion);
      }} />
  </div>
{/if}
