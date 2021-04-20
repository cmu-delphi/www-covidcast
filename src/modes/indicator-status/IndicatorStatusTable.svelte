<script>
  import SortColumnIndicator from '../mobile/components/SortColumnIndicator.svelte';
  import FancyHeader from '../mobile/FancyHeader.svelte';
  import { formatDateISO, formatDateShortNumbers, formatFraction } from '../../formats';
  import DownloadMenu from '../mobile/components/DownloadMenu.svelte';
  import Vega from '../../components/vega/Vega.svelte';
  import { generateSparkLine } from '../../specs/lineSpec';
  import { createEventDispatcher } from 'svelte';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { SortHelper } from '../mobile/components/tableUtils';

  const dispatch = createEventDispatcher();
  /**
   * @type {Date}
   */
  export let date;

  const sort = new SortHelper('name', false, 'name');
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
    const comparator = $sort.comparator;
    data.then((rows) => {
      sortedData = rows.slice().sort(comparator);
      loading = false;
    });
  }

  $: spec = generateSparkLine({
    dateField: 'date',
    valueField: 'fraction',
    domain: domain.domain,
    highlightDate: null,
    highlightStartEnd: false,
    // zero: true,
    // valueDomain: [0, 1]
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
      <th class="mobile-th uk-text-right">Latest County Coverage</th>
      <th class="mobile-th uk-text-right">
        <span>County Coverage</span>
        <div class="mobile-th-range">
          <span> {formatDateShortNumbers(domain.min)} </span>
          <span> {formatDateShortNumbers(domain.max)} </span>
        </div>
      </th>
      <th />
    </tr>
    <tr>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label="Name" {sort} prop="name" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Latest Issue Date" {sort} prop="latest_issue" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Latest Data Date" {sort} prop="latest_time_value" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Lag" {sort} prop="latest_lag" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Latest Coverage" {sort} prop="latest_coverage" />
      </th>
      <th class="sort-indicator" />
      <th class="sort-indicator" />
    </tr>
  </thead>
  <tbody>
    {#each sortedData as r (r.name)}
      <tr>
        <td>
          <a href="#{r.id}" on:click|preventDefault={() => dispatch('select', r)}>{r.name}</a>
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
          <a href="#{r.id}" class="uk-link-text details-link" on:click|preventDefault={() => dispatch('select', r)}>
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
