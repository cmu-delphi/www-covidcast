<script>
  import IndicatorStatusTable from './IndicatorStatusTable.svelte';
  import IndicatorStatus from './IndicatorStatus.svelte';
  import { loadData, determineDomain } from './data';
  import Search from '../../components/Search.svelte';
  import { updateHash } from '../../stores/urlHandler';
  import IndicatorBackfill from './IndicatorBackfill.svelte';

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
    const fullId = window.location.hash.slice(1); // remove #
    const targetMode = fullId.endsWith('_b') ? 'backfill' : 'coverage';
    const id = fullId.endsWith('_b') ? fullId.slice(0, -2) : fullId;
    const found = rows.find((d) => d.id === id);
    return { selected: found, mode: found ? targetMode : 'overview' };
  }

  /**
   * @type {import('./data').ExtendedStatus | null}
   */
  let selected = null;

  /**
   * @type {'overview' | 'coverage' | 'backfill'}
   */
  let mode = 'overview';

  $: {
    loadedData = [];
    domain = determineDomain([]);
    data.then((rows) => {
      const r = resolveDefaultStatus(rows);
      selected = r.selected;
      mode = r.mode;
      loadedData = rows;
      domain = determineDomain(rows);
    });
  }

  function switchToDetails(e) {
    selected = e.detail;
    mode = 'coverage';
  }

  function switchMode(m, s) {
    mode = m;
    selected = s;
  }

  $: {
    if (loadedData.length > 0) {
      updateHash(selected ? `${selected.id}${mode == 'backfill' ? '_b' : ''}` : '');
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
        <li class:uk-active={mode === 'overview'}>
          <a href="#overview" on:click|preventDefault={() => switchMode('overview', null)}>Overview</a>
        </li>
        <li class:uk-active={mode === 'coverage'}>
          <a
            href="#{(loadedData[0] || { id: 'details' }).id}"
            on:click|preventDefault={() => switchMode('coverage', loadedData[0])}>Coverage Details</a
          >
        </li>
        <li class:uk-active={mode === 'backfill'}>
          <a
            href="#{(loadedData[0] || { id: 'details' }).id}_b"
            on:click|preventDefault={() => switchMode('backfill', loadedData[0])}>Backfill Profile</a
          >
        </li>
      </ul>
    </div>
    {#if mode === 'overview'}
      <div class="grid-3-11">
        <IndicatorStatusTable {data} {date} on:select={switchToDetails} {domain} />
      </div>
    {:else}
      <Search
        className="grid-3-11"
        modern
        placeholder="Select Indicator"
        title="Indicator"
        items={loadedData}
        icon="search"
        selectedItem={selected}
        labelFieldName="name"
        maxItemsToShowInList="15"
        clear={false}
        on:change={(e) => {
          const newIndicator = e.detail ? loadedData.find((d) => d.name === e.detail.name) : null;
          if (newIndicator !== selected) {
            selected = newIndicator;
            if (!selected) {
              mode = 'overview';
            }
          }
        }}
      />
      {#if mode === 'coverage'}
        <IndicatorStatus {domain} signal={selected} />
      {:else}
        <IndicatorBackfill {domain} indicator={selected} />
      {/if}
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
