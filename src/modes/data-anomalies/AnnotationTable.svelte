<script>
  import SortColumnIndicator from '../mobile/components/SortColumnIndicator.svelte';

  import { SortHelper } from '../mobile/components/tableUtils';

  const sort = new SortHelper('name', false, 'name');
  let sortedRegions = [];

  $: loadedData = Promise.resolve([]);

  let loading = true;
  $: {
    loading = true;
    const comparator = $sort.comparator;
    loadedData.then((rows) => {
      sortedRegions = rows.sort(comparator);
      loading = false;
    });
  }
</script>

<table class="mobile-table" class:loading>
  <thead>
    <tr>
      <th class="mobile-th">A</th>
    </tr>
    <tr>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label="A" {sort} prop="a" />
      </th>
    </tr>
  </thead>
  <tbody>
    {#each sortedRegions as r (r.name)}
      <tr />
    {/each}
  </tbody>
</table>

<style>
  /* .table-value {
    white-space: nowrap;
    font-weight: 700;
  } */
</style>
