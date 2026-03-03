<script>
  import SortColumnIndicator, { SortHelper } from '../../components/SortColumnIndicator.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import { formatDateISO, formatDateShortNumbers, formatFraction, formatWeek, formatValue } from '../../formats';
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

  $: {
    console.log('sortedData', sortedData);
  }
</script>

<div class="uk-position-relative">
  <FancyHeader>Summary</FancyHeader>
  <DownloadMenu
    fileName="indicator_status_as_of_{formatDateISO(date)}"
    data={loader.loaded}
    absolutePos
    prepareRow={(row) => ({
      original_data_provider: row.original_data_provider,
      reference_indicator_name: row.reference_indicator_name,
      latest_issue: row.latest_issue,
      typical_reporting_cadence: row.time_type == 'day' ? 1 : 7,
      latest_time_value: row.latest_time_value,
      latest_coverage: row.latest_coverage,
      latest_lag: row.latest_lag_days,
      latest_report_delay: row.latest_report_delay,
      reporting_delay_index: row.reporting_delay_index,
      data_staleness_index: row.data_staleness_index,
    })}
    advanced={false}
  />
</div>

<table class="mobile-table" class:loading>
  <thead>
    <tr>
      <th class="mobile-th">Original Data Provider</th>
      <th class="mobile-th">Reference Indicator</th>
      <th class="mobile-th uk-text-center" colspan="8">Status</th>
      <th rowspan="2" />
    </tr>
    <tr>
      <th />
      <th />
      <th class="mobile-th uk-text-right" title="Date the most recent update was published by Delphi">Latest Issue</th>
      <th class="mobile-th uk-text-center" title="Date the most recent update was published by Delphi"
        >Typical Reporting Cadence</th
      >
      <th class="mobile-th uk-text-right" title="Most recent date for which data is available">Latest Data</th>
      <th class="mobile-th uk-text-center" title="Typical Reporting Lag">Typical Reporting Lag</th>
      <th class="mobile-th uk-text-center" title="Lag to Today">Lag to Today</th>
      <th class="mobile-th uk-text-center" title="Reporting Delay Index">Reporting Delay Index</th>
      <th class="mobile-th uk-text-center" title="Data Staleness Index">Data Staleness Index</th>
      <th class="mobile-th uk-text-center" title="Percent of US counties included in latest day of data"
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
        <SortColumnIndicator label="Original Data Provider" {sort} prop="original_data_provider" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Reference Indicator" {sort} prop="reference_indicator_name" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Latest Issue" {sort} prop="latest_issue" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Typical Reporting Cadence" {sort} prop="typical_reporting_cadence" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Latest Data" {sort} prop="latest_time_value" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Lag" {sort} prop="latest_lag_days" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Reporting Delay" {sort} prop="latest_report_delay" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Delay Index" {sort} prop="reporting_delay_index" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Staleness Index" {sort} prop="data_staleness_index" />
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
            on:click|preventDefault={() => dispatch('select', r)}>{r.original_data_provider}</a
          >
          <div
            class="source"
            title="Use 'data_source={r.source}' when fetching from the covidcast endpoint of the Epidata API."
          >
            API data_source: {r.source}
          </div>
        </td>
        <td>
          <a
            href="../indicator-signal?sensor={r.ref.key}"
            on:click|preventDefault={() => dispatch('selectSignal', r.ref)}>{r.ref.name}</a
          >
        </td>
        <td class="uk-text-right uk-text-nowrap">
          {r.ref.isWeeklySignal ? formatWeek(r.latest_issue_week) : formatDateISO(r.latest_issue)}
        </td>
        <td class="uk-text-center uk-text-nowrap">
          {r.time_type == 'day' ? 1 : 7}
        </td>
        <td class="uk-text-right uk-text-nowrap">
          {r.ref.isWeeklySignal ? formatWeek(r.latest_data_week) : formatDateISO(r.latest_data)}
        </td>
        <td class="uk-text-right uk-text-nowrap">
          {r.latest_lag}
        </td>
        <td class="uk-text-right uk-text-nowrap">
          {r.latest_report_delay}
        </td>
        <td class="uk-text-center uk-text-nowrap">
          {formatValue(r.reporting_delay_index)}
        </td>
        <td class="uk-text-center uk-text-nowrap">
          {formatValue(r.data_staleness_index)}
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
