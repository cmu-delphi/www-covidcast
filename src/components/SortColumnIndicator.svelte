<script context="module">
  import { writable, get } from 'svelte/store';

  function clean(a) {
    // normalize :NaN to null
    return typeof a === 'number' && Number.isNaN(a) ? null : a;
  }

  function comparator(prop, sortDirectionDesc, defaultAttr, preSorter) {
    const less = sortDirectionDesc ? 1 : -1;
    return (a, b) => {
      const pre = preSorter(a, b);
      if (pre !== 0) {
        return pre;
      }
      const av = clean(a[prop]);
      const bv = clean(b[prop]);
      if ((av == null) !== (bv == null)) {
        return av == null ? 1 : -1;
      }
      if (av !== bv) {
        return av < bv ? less : -less;
      }
      if (a[defaultAttr] !== b[defaultAttr]) {
        return a[defaultAttr] < b[defaultAttr] ? less : -less;
      }
      return 0;
    };
  }

  export class SortHelper {
    constructor(sortCriteria, sortDirectionDesc, defaultAttr = 'displayName', preSorter = () => 0) {
      this.store = writable({
        sortCriteria,
        sortDirectionDesc,
        comparator: comparator(sortCriteria, sortDirectionDesc, defaultAttr, preSorter),
      });
      this._defaultAttr = defaultAttr;
      this._preSorter = preSorter;
      this.subscribe = this.store.subscribe;
    }

    get sortCriteria() {
      return get(this.store).sortCriteria;
    }
    get sortDirectionDesc() {
      return get(this.store).sortDirectionDesc;
    }

    get comparator() {
      return get(this.store).comparator;
    }

    change(prop, defaultSortDesc = false) {
      if (this.sortCriteria === prop) {
        this.store.set({
          sortCriteria: prop,
          sortDirectionDesc: !this.sortDirectionDesc,
          comparator: comparator(prop, !this.sortDirectionDesc, this._defaultAttr, this._preSorter),
        });
        return;
      }
      this.store.set({
        sortCriteria: prop,
        sortDirectionDesc: defaultSortDesc,
        comparator: comparator(prop, defaultSortDesc, this._defaultAttr, this._preSorter),
      });
    }
  }

  export function byImportance(a, b) {
    if (a.important && b.important) {
      // state vs nation
      return a.level === 'nation' ? -1 : 1;
    }
    if (a.important !== b.important) {
      return a.important ? -1 : 1;
    }
    return 0;
  }
</script>

<script>
  import chevronDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
  import chevronUpIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-up.svg';

  export let label;
  /**
   * @type {import('./tableUtils').SortHelper}
   */
  export let sort;
  /**
   * @type {string}
   */
  export let prop;

  export let defaultDesc = false;

  $: sorted = $sort.sortCriteria === prop;
  $: desc = $sort.sortDirectionDesc;

  function toggleSort() {
    sort.change(prop, defaultDesc);
  }
</script>

<span>
  <button
    class="inline-svg-icon sort-indicator"
    class:active={sorted}
    on:click={toggleSort}
    title="Sort {label} {desc ? 'ascending' : 'descending'}"
  >
    {#if sorted && desc}
      {@html chevronDownIcon}
    {:else}
      {@html chevronUpIcon}
    {/if}
  </button>
</span>

<style>
  .sort-indicator {
    border: none;
    background: none;
    font-weight: inherit;
    text-transform: uppercase;
    color: inherit;
    opacity: 0.4;
    padding: 0;
    cursor: pointer;
  }

  .sort-indicator:hover,
  .sort-indicator.active {
    opacity: 1;
  }
</style>
