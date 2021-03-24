<script>
  import SortColumnIndicator from '../mobile/SortColumnIndicator.svelte';
  import FancyHeader from '../mobile/FancyHeader.svelte';
  import { formatDateISO, formatDateShortNumbers, formatFraction } from '../../formats';
  import DownloadMenu from '../mobile/components/DownloadMenu.svelte';
  import Vega from '../../components/Vega.svelte';
  import { generateSparkLine } from '../../specs/lineSpec';
  import { createEventDispatcher } from 'svelte';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';

  const dispatch = createEventDispatcher();
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
   * @type {Promise<import('./data').ExtendedStatus[]>}
   */
  export let data = Promise.resolve([]);
  /**
   * @type {import('../../stores/params').TimeFrame}
   */
  export let domain;

  /**
   * @type {import('./data').ExtendedStatus[]}
   */
  let sortedData = [];
  let loading = true;
  $: {
    loading = true;
    sortedData = [];
    data.then((rows) => {
      sortedData = rows.slice().sort(comparator);
      loading = false;
    });
  }

  $: spec = generateSparkLine({
    dateField: 'date',
    valueField: 'count',
    domain: domain.domain,
    highlightDate: null,
    highlightStartEnd: false,
  });
</script>

<div class="uk-position-relative">
  <FancyHeader>Summary</FancyHeader>
  <DownloadMenu
    fileName="indicator_status_as_of_{formatDateISO(date)}"
    {data}
    absolutePos
    prepareRow={(row) => ({
      name: row.name,
      latest_issue: row.latest_issue,
      latest_time_value: row.latest_time_value,
      latest_coverage: row.latest_coverage,
      latest_lag: row.latest_lag,
    })}
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
      <th class="mobile-th uk-text-right">Latest Coverage</th>
      <th class="mobile-th uk-text-right">
        <span>Coverage</span>
        <div class="mobile-th-range">
          <span> {formatDateShortNumbers(domain.min)} </span>
          <span> {formatDateShortNumbers(domain.max)} </span>
        </div>
      </th>
      <th />
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
          on:click={() => sortClick('latest_lag')}
          sorted={sortCriteria === 'latest_lag'}
          desc={sortDirectionDesc}
        />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator
          label="Latest Coverage"
          on:click={() => sortClick('latest_coverage')}
          sorted={sortCriteria === 'latest_coverage'}
          desc={sortDirectionDesc}
        />
      </th>
      <th class="sort-indicator" />
      <th class="sort-indicator" />
    </tr>
  </thead>
  <tbody>
    {#each sortedData as r (r.name)}
      <tr>
        <td>
          <a href="#{r.name}" on:click|preventDefault={() => dispatch('select', r)}>{r.name}</a>
        </td>
        <td class="uk-text-right">
          {formatDateISO(r.latest_issue)}
        </td>
        <td class="uk-text-right">
          {formatDateISO(r.latest_time_value)}
        </td>
        <td class="uk-text-right">
          {r.latest_lag.toLocaleString()} days
        </td>
        <td class="uk-text-right">
          {formatFraction(r.latest_coverage)}
        </td>
        <td>
          <div class="mobile-table-chart mobile-table-chart-small">
            <Vega {spec} data={r.coverage.county || []} noDataText="N/A" />
          </div>
        </td>
        <td>
          <a href="#{r.name}" class="uk-link-text details-link" on:click|preventDefault={() => dispatch('select', r)}>
            {@html chevronRightIcon}
          </a>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .details-link {
    width: 6px;
    display: inline-block;
    fill: currentColor;
  }
</style>
