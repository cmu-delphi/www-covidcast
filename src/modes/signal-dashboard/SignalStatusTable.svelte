<script>
  import SortColumnIndicator from '../mobile/SortColumnIndicator.svelte';
  import FancyHeader from '../mobile/FancyHeader.svelte';
  import { formatDateISO } from '../../formats';
  import DownloadMenu from '../mobile/components/DownloadMenu.svelte';
  import { getIndicatorStatuses } from '../../data/indicatorInfo';
  import { timeDay } from 'd3-time';

  let sortCriteria = 'name';
  let sortDirectionDesc = false;

  function bySortCriteria(sortCriteria, sortDirectionDesc) {
    const less = sortDirectionDesc ? 1 : -1;

    function clean(a) {
      // normalize NaN to null
      return typeof a === 'number' && Number.isNaN(a) ? null : a;
    }
    return (a, b) => {
      const av = clean(a[sortCriteria]);
      const bv = clean(b[sortCriteria]);
      if ((av == null) !== (bv == null)) {
        return av == null ? 1 : -1;
      }
      if (av !== bv) {
        return av < bv ? less : -less;
      }
      if (a.name !== b.name) {
        return a.name < b.name ? less : -less;
      }
      return 0;
    };
  }

  function sortClick(prop, defaultSortDesc = false) {
    if (sortCriteria === prop) {
      sortDirectionDesc = !sortDirectionDesc;
      return;
    }
    sortCriteria = prop;
    sortDirectionDesc = defaultSortDesc;
  }

  $: comparator = bySortCriteria(sortCriteria, sortDirectionDesc);

  const today = new Date();
  const loadedData = getIndicatorStatuses().then((rows) =>
    rows.map((r) => ({
      ...r,
      lag: timeDay.count(today, r.latest_data_date),
    })),
  );

  let sortedData = [];
  let loading = true;
  $: {
    loading = true;
    sortedData = [];
    loadedData.then((rows) => {
      sortedData = rows.slice().sort(comparator);
      loading = false;
    });
  }
</script>

<div class="uk-position-relative">
  <FancyHeader anchor="table" sub="Status">Signal</FancyHeader>
  <DownloadMenu
    fileName="signal_status_as_of_{formatDateISO(today)}"
    data={loadedData}
    absolutePos
    prepareRow={(row) => row}
    advanced={false}
  />
</div>

<table class="mobile-table" class:loading>
  <thead>
    <tr>
      <th class="mobile-th">Signal Name</th>
      <th class="mobile-th uk-text-right">Latest Issue</th>
      <th class="mobile-th uk-text-right">Latest Data Available</th>
      <th class="mobile-th uk-text-right">Lag to Today</th>
    </tr>
    <tr>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator
          label="Name"
          on:click={() => sortClick('displayName')}
          sorted={sortCriteria === 'displayName'}
          desc={sortDirectionDesc}
        />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator
          label="Latest Issue Date"
          on:click={() => sortClick('latest_issue_date')}
          sorted={sortCriteria === 'latest_issue_date'}
          desc={sortDirectionDesc}
        />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator
          label="Latest Data Date"
          on:click={() => sortClick('latest_data_date')}
          sorted={sortCriteria === 'latest_data_date'}
          desc={sortDirectionDesc}
        />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator
          label="Lag"
          on:click={() => sortClick('lag')}
          sorted={sortCriteria === 'lag'}
          desc={sortDirectionDesc}
        />
      </th>
    </tr>
  </thead>
  <tbody>
    {#each sortedData as r (r.name)}
      <tr>
        <td>
          {r.name}
        </td>
        <td class="uk-text-right">
          {formatDateISO(r.latest_issue_date)}
        </td>
        <td class="uk-text-right">
          {formatDateISO(r.latest_data_date)}
        </td>
        <td class="uk-text-right">
          {r.lag.toLocaleString()} days
        </td>
      </tr>
    {/each}
  </tbody>
</table>
