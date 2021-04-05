<script>
  import { annotationManager, getLevelInfo } from '../../stores';
  import SortColumnIndicator from '../mobile/components/SortColumnIndicator.svelte';
  import { SortHelper } from '../mobile/components/tableUtils';
  import ExternalLinkIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/external-link-alt.svg';
  import { getDataSource, CASES_DEATH_SOURCE } from '../../stores/dataSourceLookup';
  import { formatDateISO } from '../../formats';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { getInfoByName } from '../../maps';
  import { isCasesSignal, isDeathSignal } from '../../data';

  /**
   *
   * @param {import ('../../data/annotations').Annotation} d
   */
  function simplifyAnnotation(d, i) {
    return {
      i,
      annotation: d,
      problem: d.problem,
      // in case just of cases/death replace with custom data source name
      source:
        [...d.signals].every((s) => isCasesSignal(s) || isDeathSignal(s)) && d.source === 'indicator-combination'
          ? getDataSource(CASES_DEATH_SOURCE)
          : getDataSource(d.source),
      reference: d.reference,
      dateRange: `${formatDateISO(d.dates[0])} - ${formatDateISO(d.dates[1])}`,
    };
  }

  const sort = new SortHelper('dateRange', true, 'dateRange');
  $: data = $annotationManager.annotations.map(simplifyAnnotation);
  $: sortedRows = data.sort($sort.comparator);

  let details = -1;

  function signals(signals) {
    return signals === '*' ? 'All Signals' : [...signals].join(', ');
  }
  function region(regions) {
    const mapped = regions
      .map((d) => {
        if (d.level === 'nation') {
          return 'Whole USA';
        }
        if (d.level === 'state') {
          return d.ids === '*' ? 'All US States' : [...d.ids].map((d) => d.toUpperCase()).join(', ');
        }
        return null;
      })
      .filter((d) => d != null);
    if (mapped.length < regions.length) {
      mapped.push('...');
    }
    return mapped.join(', ');
  }
  function regionLong(regions) {
    return regions
      .map((d) => {
        if (d.level === 'nation') {
          return 'Whole USA';
        }
        if (d.level === 'state') {
          return d.ids === '*'
            ? 'All US States'
            : Array.from(d.ids, (d) => getInfoByName(d))
                .map((d) => d.displayName)
                .join(', ');
        }
        if (d.level === 'county') {
          return d.ids === '*'
            ? 'All US Counties'
            : Array.from(d.ids, (d) => getInfoByName(d))
                .map((d) => d.displayName)
                .join(', ');
        }
        const level = getLevelInfo(d.level);
        return d.ids === '*' ? `All ${level.labelPlural}` : `${level.label}: ${[...d.ids].join(', ')}`;
      })
      .join(', ');
  }
</script>

<table class="mobile-table">
  <thead>
    <tr>
      <th />
      <th class="mobile-th">Data Source</th>
      <th class="mobile-th">Problem</th>
      <th class="mobile-th">Date Range</th>
      <th class="mobile-th">Regions</th>
      <th class="mobile-th">Source</th>
    </tr>
    <tr>
      <th />
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label="Data Source" {sort} prop="source" />
      </th>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label="Problem" {sort} prop="problem" />
      </th>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label="Date Range" {sort} prop="dateRange" />
      </th>
      <th class="sort-indicator uk-text-center" />
      <th class="sort-indicator uk-text-center" />
    </tr>
  </thead>
  <tbody>
    {#each sortedRows as r}
      <tr>
        <td>
          <button
            type="button"
            title="Toggle Details"
            on:click={() => (details = details === r.i ? -1 : r.i)}
            class="toggle-details"
            class:open={details === r.i}
          >
            {@html chevronRightIcon}
          </button>
        </td><td>{r.source}</td>
        <td>{r.problem}</td>
        <td>
          <span class="uk-text-nowrap">{formatDateISO(r.annotation.dates[0])}</span>
          -
          <span class="uk-text-nowrap">{formatDateISO(r.annotation.dates[1])}</span>
        </td>
        <td>{region(r.annotation.regions)}</td>
        <td>
          {#if r.reference}
            <a href={r.refernce} class="uk-link-text details-link">
              {@html ExternalLinkIcon}
            </a>
          {/if}
        </td>
      </tr>
      {#if details === r.i}
        <tr>
          <td />
          <td colspan="5">
            <p>
              {r.annotation.explanation}
            </p>
            <p><strong>Affected Signals:</strong> {signals(r.annotation.signals)}</p>
            <p><strong>Affected Regions:</strong> {regionLong(r.annotation.regions)}</p>
          </td>
        </tr>
      {/if}
    {/each}
  </tbody>
</table>

<style>
  .toggle-details {
    border: none;
    background: none;
    padding: 0;
    width: 0.8em;
    cursor: pointer;
    transition: transform 0.25s linear;
  }

  .open {
    transform: rotate(90deg);
  }

  .toggle-details > :global(svg) {
    width: 1em;
  }

  .details-link {
    width: 1em;
    display: inline-block;
    fill: currentColor;
  }
</style>
