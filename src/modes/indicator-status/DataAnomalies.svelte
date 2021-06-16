<script>
  import { annotationManager } from '../../stores';
  import SortColumnIndicator, { SortHelper } from '../../components/SortColumnIndicator.svelte';
  import ExternalLinkIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/external-link-alt.svg';
  import { getLevelInfo } from '../../data/geoLevel';
  import { formatDateISO } from '../../formats';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { getCountiesOfState, getInfoByName, getStatesOfHHS, nationInfo } from '../../data/regions';

  /**
   * @type {import('../../data/sensor').Sensor}
   */
  export let sensor;
  /**
   * @type {import('../../data/regions').Region}
   */
  export let region;

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
      source: sensor.dataSourceName,
      reference: d.reference,
      dateRange: `${formatDateISO(d.dates[0])} - ${formatDateISO(d.dates[1])}`,
    };
  }

  /**
   *
   * @param {import('../../data/annotations').AnnotationManager} annotationManager
   * @param {import('../../data/sensor').Sensor} sensor
   * @param {import('../../data/regions').Region | null} region
   */
  function getAnnotations(annotationManager, sensor, region) {
    const r = region || nationInfo;
    /**
     * @param {import('../../data/annotations').Annotation} d
     */
    function matchRegion(d) {
      if (!d.matchSensor(sensor)) {
        return false;
      }
      if (r.level === 'nation' || d.matchRegion(r)) {
        return true;
      }
      // match also lower levels
      if (r.level === 'state') {
        // county
        return d.matchRegion(getCountiesOfState(d));
      }
      if (r.level === 'hhs') {
        // state or county
        const states = getStatesOfHHS(r);
        return d.matchRegion(states) || states.some((s) => d.matchRegion(getCountiesOfState(s)));
      }
      return false;
    }
    const annotations = annotationManager.annotations.filter(matchRegion);
    return annotations.map((a, i) => simplifyAnnotation(a, i));
  }

  const sort = new SortHelper('dateRange', true, 'dateRange');
  $: data = getAnnotations($annotationManager, sensor, region);
  $: sortedRows = data.sort($sort.comparator);

  let details = -1;

  function signals(signals) {
    return signals === '*' ? 'All Signals' : [...signals].join(', ');
  }
  function regionName(regions) {
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

{#if data.length === 0}
  <div class="uk-alert uk-alert-info">No data anomalies recorded</div>
{:else}
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
          <td>{regionName(r.annotation.regions)}</td>
          <td>
            {#if r.reference}
              <a href={r.reference} class="uk-link-text details-link">
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
{/if}

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
