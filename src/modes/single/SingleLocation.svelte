<script>
  import Search from '../../components/Search.svelte';
  import { nameInfos } from '../../maps';
  import { currentRegionInfo, selectByInfo } from '../../stores';

  let loading = false;
</script>

<style>
  .root {
  }
</style>

<div class="root">
  <Search
    className="search-container container-bg container-style"
    placeholder="Search for a location..."
    items={nameInfos}
    selectedItem={$currentRegionInfo}
    labelFieldName="displayName"
    maxItemsToShowInList="5"
    on:change={(e) => selectByInfo(e.detail)} />

  <div class="table base-font-size" class:loading />
</div>
