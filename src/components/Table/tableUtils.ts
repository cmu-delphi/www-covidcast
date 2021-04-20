import { writable, get, Writable } from 'svelte/store';
import type { RegionLevel } from '../../data/regions';

function clean(a: unknown): string | Date | number | boolean | null {
  // normalize :NaN to null
  return typeof a === 'number' && Number.isNaN(a) ? null : (a as string);
}

function comparator<T extends Record<string, unknown>>(
  prop: keyof T,
  sortDirectionDesc: boolean,
  defaultAttr: keyof T,
  preSorter: (a: T, b: T) => number,
) {
  const less = sortDirectionDesc ? 1 : -1;
  return (a: T, b: T) => {
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
      return av! < bv! ? less : -less;
    }
    if (a[defaultAttr] !== b[defaultAttr]) {
      return a[defaultAttr] < b[defaultAttr] ? less : -less;
    }
    return 0;
  };
}

export class SortHelper<T extends Record<string, unknown>> {
  private readonly _defaultAttr: keyof T;
  private readonly _preSorter: (a: T, b: T) => number;
  private readonly store: Writable<{
    sortCriteria: keyof T;
    sortDirectionDesc: boolean;
    comparator: (a: T, b: T) => number;
  }>;
  readonly subscribe: Writable<{
    sortCriteria: keyof T;
    sortDirectionDesc: boolean;
    comparator: (a: T, b: T) => number;
  }>['subscribe'];

  constructor(
    sortCriteria: keyof T,
    sortDirectionDesc: boolean,
    defaultAttr: keyof T = 'displayName',
    preSorter: (a: T, b: T) => number = () => 0,
  ) {
    this.store = writable({
      sortCriteria,
      sortDirectionDesc,
      comparator: comparator(sortCriteria, sortDirectionDesc, defaultAttr, preSorter),
    });
    this._defaultAttr = defaultAttr;
    this._preSorter = preSorter;
    this.subscribe = this.store.subscribe;
  }

  get sortCriteria(): keyof T {
    return get(this.store).sortCriteria;
  }
  get sortDirectionDesc(): boolean {
    return get(this.store).sortDirectionDesc;
  }

  get comparator(): (a: T, b: T) => number {
    return get(this.store).comparator;
  }

  change(prop: keyof T, defaultSortDesc = false): void {
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

export function byImportance<T extends { important?: boolean; level?: RegionLevel }>(a: T, b: T): number {
  if (a.important && b.important) {
    // state vs nation
    return a.level === 'nation' ? -1 : 1;
  }
  if (a.important !== b.important) {
    return a.important ? -1 : 1;
  }
  return 0;
}
