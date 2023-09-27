<script>
  import SortColumnIndicator, { SortHelper } from '../../components/SortColumnIndicator.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import { formatDateISO, formatDateShortNumbers, formatFraction, formatWeek } from '../../formats';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
  import Vega from '../../components/vega/Vega.svelte';
  import { generateSparkLine } from '../../specs/lineSpec';
  import { createEventDispatcher } from 'svelte';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { metaDataManager } from '../../stores';
  import { loadData } from './data';

  const dispatch = createEventDispatcher();

  $: sources = $metaDataManager.metaSources.filter((d) => d.referenceSensor != null && d.sensors.some((s) => s.active));

  const date = new Date();

  const sort = new SortHelper('name', false, 'name');

  $: loader = loadData(sources, $metaDataManager);
  /**
   * @type {import('./data').SourceData[]}
   */
  let sortedData = [];
  let loading = true;
  $: {
    loading = true;
    sortedData = loader.initial;
    const comparator = $sort.comparator;
    loader.loaded.then((rows) => {
      // do not display signals that are "active" but more than 6 months out of date
      rows = rows.filter((r) => r.latest_lag_days <= 180);
      sortedData = rows.slice().sort(comparator);
      loading = false;
    });
  }

  $: spec = generateSparkLine({
    dateField: 'date',
    valueField: 'fraction',
    domain: loader.domain.domain,
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
    data={loader.loaded}
    absolutePos
    prepareRow={(row) => ({
      name: row.name,
      latest_issue: row.latest_issue,
      latest_time_value: row.latest_time_value,
      latest_coverage: row.latest_coverage,
      latest_lag: row.latest_lag_days,
    })}
    advanced={false}
  />
</div>

<table class="mobile-table" class:loading>
  <thead>
    <tr>
      <th class="mobile-th">Data Source</th>
      <th class="mobile-th uk-text-center" colspan="5">Reference Signal</th>
      <th rowspan="2" />
    </tr>
    <tr>
      <th />
      <th class="mobile-th uk-text-right" title="Date the most recent update was published by Delphi">Latest Issue</th>
      <th class="mobile-th uk-text-right" title="Most recent date for which data is available">Latest Data</th>
      <th class="mobile-th uk-text-right">Lag to Today</th>
      <th class="mobile-th uk-text-right" title="Percent of US counties included in latest day of data"
        >Latest County Coverage</th
      >
      <th class="mobile-th uk-text-right">
        <span title="Percent of US counties included">County Coverage</span>
        <div class="mobile-th-range">
          <span> {formatDateShortNumbers(loader.domain.min)} </span>
          <span> {formatDateShortNumbers(loader.domain.max)} </span>
        </div>
      </th>
    </tr>
    <tr>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label="Name" {sort} prop="name" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Latest Issue" {sort} prop="latest_issue" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Latest Data" {sort} prop="latest_time_value" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Lag" {sort} prop="latest_lag_days" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Latest Coverage" {sort} prop="latest_coverage" />
      </th>
      <th class="sort-indicator" />
      <th class="sort-indicator" />
    </tr>
  </thead>
  <tbody>
    {#each sortedData as r}
      <tr>
        <td>
          <a
            href="../indicator-source?sensor={r.source}-{r.reference_signal}"
            on:click|preventDefault={() => dispatch('select', r)}>{r.name}</a
          >
          <div
            class="source"
            title="Use 'data_source={r.source}' when fetching from the covidcast endpoint of the Epidata API."
          >
            API data_source: {r.source}
          </div>
        </td>
        <td class="uk-text-right uk-text-nowrap">
          {r.ref.isWeeklySignal ? formatWeek(r.latest_issue_week) : formatDateISO(r.latest_issue)}
        </td>
        <td class="uk-text-right uk-text-nowrap">
          {r.ref.isWeeklySignal ? formatWeek(r.latest_data_week) : formatDateISO(r.latest_data)}
        </td>
        <td class="uk-text-right uk-text-nowrap">
          {r.latest_lag}
        </td>
        <td class="uk-text-right uk-text-nowrap">
          {formatFraction(r.latest_coverage)}
        </td>
        <td>
          <div class="mobile-table-chart mobile-table-chart-small">
            <Vega {spec} data={r.coverages} noDataText={r.supports_county ? 'N/A' : 'Not Supported'} />
          </div>
        </td>
        <td>
          <a
            href="../indicator-source?sensor={r.source}-{r.covidcast_signal}"
            class="uk-link-text details-link"
            on:click|preventDefault={() => dispatch('select', r)}
          >
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
  .source {
    font-size: 0.75rem;
  }
</style>
