<script>
  import SortColumnIndicator from '../mobile/SortColumnIndicator.svelte';
  import FancyHeader from '../mobile/FancyHeader.svelte';
  import { formatDateISO, formatDateShortNumbers } from '../../formats';
  import DownloadMenu from '../mobile/components/DownloadMenu.svelte';
  import { getIndicatorStatuses } from '../../data/indicatorInfo';
  import { timeDay } from 'd3-time';
  import Vega from '../../components/Vega.svelte';
  import { generateSparkLine } from '../../specs/lineSpec';

  /**
   * @type {Date}
   */
  export let date;

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

  /**
   *
   * @param {Date}date
   * @returns {Promise<(import('../../data/indicatorInfo').IndicatorStatus & {lag: number})[]>}
   */
  function loadData(date) {
    return getIndicatorStatuses().then((rows) =>
      rows.map((r) => ({
        ...r,
        lag: timeDay.count(r.latest_time_value, date),
      })),
    );
  }

  $: loadedData = loadData(date);
  /**
   * @type {(import('../../data/indicatorInfo').IndicatorStatus & {lag: number})[]}
   */
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

  function determineDomain(data) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    if (data.length === 0) {
      return [new Date(), new Date()];
    }
    for (const row of data) {
      for (const coverage of row.coverage.county || []) {
        const d = coverage.date.getTime();
        if (d < min) {
          min = d;
        }
        if (d > max) {
          max = d;
        }
      }
    }
    return [min, max];
  }

  $: domain = determineDomain(sortedData);
  $: spec = generateSparkLine({
    dateField: 'date',
    valueField: 'count',
    domain,
    highlightDate: null,
    highlightStartEnd: false,
  });
</script>

<div class="uk-position-relative">
  <FancyHeader anchor="table" sub="Status">Signal</FancyHeader>
  <DownloadMenu
    fileName="signal_status_as_of_{formatDateISO(date)}"
    data={loadedData}
    absolutePos
    prepareRow={(row) => row}
    advanced={false}
  />
</div>

<table class="mobile-table" class:loading>
  <thead>
    <tr>
      <th class="mobile-th">Indicator</th>
      <th class="mobile-th uk-text-right">Latest Issue</th>
      <th class="mobile-th uk-text-right">Latest Data Available</th>
      <th class="mobile-th uk-text-right">Lag to Today</th>
      <th class="mobile-th uk-text-right">
        <span>Coverage</span>
        <div class="mobile-th-range">
          <span> {formatDateShortNumbers(new Date(domain[0]))} </span>
          <span> {formatDateShortNumbers(new Date(domain[1]))} </span>
        </div>
      </th>
    </tr>
    <tr>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator
          label="Name"
          on:click={() => sortClick('name')}
          sorted={sortCriteria === 'name'}
          desc={sortDirectionDesc}
        />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator
          label="Latest Issue Date"
          on:click={() => sortClick('latest_issue')}
          sorted={sortCriteria === 'latest_issue'}
          desc={sortDirectionDesc}
        />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator
          label="Latest Data Date"
          on:click={() => sortClick('latest_time_value')}
          sorted={sortCriteria === 'latest_time_value'}
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
      <th class="sort-indicator" />
    </tr>
  </thead>
  <tbody>
    {#each sortedData as r (r.name)}
      <tr>
        <td>
          {r.name}
        </td>
        <td class="uk-text-right">
          {formatDateISO(r.latest_issue)}
        </td>
        <td class="uk-text-right">
          {formatDateISO(r.latest_time_value)}
        </td>
        <td class="uk-text-right">
          {r.lag.toLocaleString()} days
        </td>
        <td>
          <div class="mobile-table-chart mobile-table-chart-small">
            <Vega {spec} data={r.coverage.county || []} noDataText="N/A" />
          </div>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
