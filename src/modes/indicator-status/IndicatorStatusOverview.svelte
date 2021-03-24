<script>
  import IndicatorStatusTable from './IndicatorStatusTable.svelte';
  import '../mobile/common.css';
  import IndicatorStatus from './IndicatorStatus.svelte';
  import { loadData, determineDomain } from './data';
  import IndicatorStatusDropdown from './IndicatorStatusDropdown.svelte';

  const date = new Date();

  $: data = loadData(date);

  let domain = determineDomain([]);
  /**
   * @type {import('./data').ExtendedStatus[]}
   */
  let loadedData = [];

  $: {
    loadedData = [];
    domain = determineDomain([]);
    data.then((rows) => {
      loadedData = rows;
      domain = determineDomain(rows);
    });
  }

  /**
   * @type {import('./data').ExtendedStatus | null}
   */
  let selected = null;

  function switchToDetails(e) {
    selected = e.detail;
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
          <a href="#overview" on:click={() => (selected = null)}>Overview</a>
        </li>
        <li class:uk-active={selected != null}>
          <a href="#details" on:click={() => (selected = loadedData[0])}>Individual</a>
        </li>
      </ul>
    </div>
    {#if selected}
      <div class="grid-3-11">
        <IndicatorStatusDropdown bind:selected {data} />
      </div>
      <IndicatorStatus signal={selected} />
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
