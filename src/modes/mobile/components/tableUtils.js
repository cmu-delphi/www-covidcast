import { writable, get } from 'svelte/store';

function clean(a) {
  // normalize NaN to null
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
    this.subscribe = this.store.subscribe.bind(this.store);
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
