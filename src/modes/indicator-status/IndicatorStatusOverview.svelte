<script>
  import IndicatorStatusTable from './IndicatorStatusTable.svelte';
  import '../mobile/common.css';
  import IndicatorStatus from './IndicatorStatus.svelte';
  import { loadData, determineDomain } from './data';
  import Search from '../../components/Search.svelte';
  import { updateHash } from '../../stores/urlHandler';

  const date = new Date();

  $: data = loadData(date);

  /**
   * @type {import('../../stores/params').TimeFrame}
   */
  let domain = determineDomain([]);
  /**
   * @type {import('./data').ExtendedStatus[]}
   */
  let loadedData = [];

  function resolveDefaultStatus(rows) {
    const id = window.location.hash.slice(1); // remove #
    return id ? rows.find((d) => d.id === id) : null;
  }

  /**
   * @type {import('./data').ExtendedStatus | null}
   */
  let selected = null;

  $: {
    loadedData = [];
    domain = determineDomain([]);
    data.then((rows) => {
      selected = resolveDefaultStatus(rows);
      loadedData = rows;
      domain = determineDomain(rows);
    });
  }

  function switchToDetails(e) {
    selected = e.detail;
  }

  $: {
    if (loadedData.length > 0) {
      updateHash(selected ? selected.id : '');
    }
  }
</script>

<div class="root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>Indicator Status <span>Overview</span></h2>
    </div>
  </div>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <ul class="uk-tab uk-child-width-expand">
        <li class:uk-active={selected == null}>
          <a href="#overview" on:click|preventDefault={() => (selected = null)}>Overview</a>
        </li>
        <li class:uk-active={selected != null}>
          <a href="#details" on:click|preventDefault={() => (selected = loadedData[0])}>Single Indicator</a>
        </li>
      </ul>
    </div>
    {#if selected}
      <Search
        className="grid-3-11"
        modern
        placeholder="Select Indicator"
        title="Indicator"
        items={loadedData}
        icon="search"
        selectedItem={selected}
        labelFieldName="name"
        maxItemsToShowInList="5"
        clear={false}
        on:change={(e) => {
          const newIndicator = e.detail ? loadedData.find((d) => d.name === e.detail.name) : null;
          if (newIndicator !== selected) {
            selected = newIndicator;
          }
        }}
      />
      <IndicatorStatus {domain} signal={selected} />
    {:else}
      <div class="grid-3-11">
        <IndicatorStatusTable {data} {date} on:select={switchToDetails} {domain} />
      </div>
    {/if}
  </div>
</div>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    font-size: 0.875rem;
    line-height: 1.5rem;
  }
  .content-grid {
    grid-row-gap: 0;
  }
</style>
