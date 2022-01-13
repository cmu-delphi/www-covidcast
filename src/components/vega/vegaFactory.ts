import { timeFormat } from 'd3-time-format';
import { format } from 'd3-format';
import embed, { EmbedOptions, Result, VisualizationSpec } from 'vega-embed';
import { Error, expressionFunction, projection, scheme } from 'vega';
import { geoAlbersUsaTerritories } from 'geo-albers-usa-territories';
import type { ExtendedFeature, GeoProjection } from 'd3-geo';
import { fitExtent, fitSize, fitWidth, fitHeight } from 'd3-geo/src/projection/fit';
import { timeDay } from 'd3-time';
import { EpiWeek } from '../../data/EpiWeek';
import { extendedColorScale } from '../../data/sensorConstants';

function patchedAlbersUsaTerritories(): GeoProjection {
  // see https://github.com/stamen/geo-albers-usa-territories/pull/8/files
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const r: GeoProjection = geoAlbersUsaTerritories();
  return Object.assign(r, {
    fitExtent(extent: [[number, number], [number, number]], object: ExtendedFeature) {
      return fitExtent(r, extent, object);
    },
    fitSize(size: [number, number], object: ExtendedFeature) {
      return fitSize(r, size, object);
    },
    fitWidth(width: number, object: ExtendedFeature) {
      return fitWidth(r, width, object);
    },
    itHeight(height: number, object: ExtendedFeature) {
      return fitHeight(r, height, object);
    },
  });
}

projection('albersUsaTerritories', patchedAlbersUsaTerritories);

expressionFunction(
  'cachedTime',
  (() => {
    const cacheTime = new Map<string, (d: Date) => string>();
    return (datum: Date, params: string): string => {
      const key = `d:${params}`;
      if (cacheTime.has(key)) {
        return cacheTime.get(key)!(datum);
      }
      const formatter = timeFormat(params);
      cacheTime.set(key, formatter);
      return formatter(datum);
    };
  })(),
);

expressionFunction('epiweek', (datum: Date): EpiWeek | null => {
  if (!datum) {
    return null;
  }
  return EpiWeek.fromDate(datum);
});

expressionFunction('epiweekFormatSmart', (datum: Date): string => {
  if (!datum) {
    return '';
  }
  const w = EpiWeek.fromDate(datum);
  if (w.week === 1) {
    return w.toString();
  }
  return `W${w.week < 10 ? '0' : ''}${w.week}`;
});

expressionFunction('epiweekFormat', (datum: Date): string => {
  if (!datum) {
    return '';
  }
  return EpiWeek.fromDate(datum).toString();
});

expressionFunction(
  'cachedNumber',
  (() => {
    const cacheNumber = new Map<string, (d: number) => string>();
    return (datum: number, params: string): string => {
      const key = `n:${params}`;
      if (cacheNumber.has(key)) {
        return cacheNumber.get(key)!(datum);
      }
      const formatter = format(params);
      cacheNumber.set(key, formatter);
      return formatter(datum);
    };
  })(),
);

export default function createVega(
  root: string | HTMLElement,
  spec: VisualizationSpec | string,
  options: EmbedOptions,
): Promise<Result> {
  return embed(root, spec, {
    actions: false,
    logLevel: Error,
    ...options,
  });
}

function customExtent(arr: Record<string, number>[], field: string): { min?: number; max?: number; range: number } {
  if (arr.length === 0) {
    return {
      min: undefined,
      max: undefined,
      range: 0,
    };
  }
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const d of arr) {
    const v = d != null ? d[field] : null;
    if (v != null) {
      min = Math.min(min, +v);
      max = Math.max(max, +v);
    }
  }

  return {
    min,
    max,
    range: max - min,
  };
}
expressionFunction('customExtent', customExtent);

function customObjChecks(
  obj: Record<string, unknown>,
  ...conditions: readonly [string, '==' | '<' | '>' | '<=' | '>=' | '===', number | string][]
): boolean {
  if (conditions.length === 0) {
    return true;
  }
  return conditions.every(([field, op, value]) => {
    const v = obj != null ? (obj[field] as number) : null;
    switch (op) {
      case '==':
        return v == value;
      case '<':
        return v != null && v < value;
      case '>':
        return v != null && v > value;
      case '>=':
        return v != null && v >= value;
      case '<=':
        return v != null && v <= value;
      default:
        return v === value;
    }
  });
}

expressionFunction('customObjChecks', customObjChecks);

/**
 * patches the given event and updates the picked item if needed
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function patchPickedItem(event: TouchEvent & { item: unknown; vega: { view(): any; item: unknown } }) {
  if (event.type === 'touchmove' || event.type === 'touchend') {
    // manually resolve, see https://github.com/vega/vega/issues/3065
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    event.item = event.vega.view()._handler.pickEvent(event.changedTouches[0]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    event.vega.item = () => event.item;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return event.item;
}
expressionFunction('patchPickedItem', patchPickedItem);

/**
 * computes padding such that the chart are is centered and squared for the given parameters
 * @param {[number, number]} container size
 */
function paddingSquareCenter(
  [width, height]: [number, number],
  domainX: unknown[],
  domainY: unknown[],
  basePadding: { left: number; top: number; right: number; bottom: number },
  paddingXOuter: number,
  paddingYOuter: number,
  factorX: number,
  factorY: number,
): { left: number; top: number; right: number; bottom: number } {
  const wBase = width - basePadding.left - basePadding.right;
  const hBase = height - basePadding.top - basePadding.bottom;
  const domainXW = domainX.length + paddingXOuter * 2;
  const domainYW = domainY.length + paddingYOuter * 2;
  const stepX = wBase / domainXW / factorX;
  const stepY = hBase / domainYW / factorY;
  const step = Math.min(stepX, stepY);
  const wPadded = domainXW * step * factorX;
  const hPadded = domainYW * step * factorY;

  return {
    left: basePadding.left + (wBase - wPadded) / 2,
    right: basePadding.right + (wBase - wPadded) / 2,
    top: basePadding.top + (hBase - hPadded) / 2,
    bottom: basePadding.bottom + (hBase - hPadded) / 2,
  };
}
expressionFunction('paddingSquareCenter', paddingSquareCenter);

function array2object<T extends Record<string, unknown>>(arr: T[], key: string): Record<string, T> {
  const r: Record<string, T> = {};
  for (const v of arr) {
    r[String(v[key])] = v;
  }
  return r;
}
expressionFunction('array2object', array2object);

expressionFunction('customInFilter', <T>(arr: Record<string, T>[], prop: string, values: T[]) =>
  arr.filter((d) => values.includes(d[prop])),
);

expressionFunction('customCountDays', (d1: Date, d2: Date) => timeDay.count(d1, d2));
expressionFunction('customCountWeeks', (d1: Date, d2: Date) => Math.floor(timeDay.count(d1, d2) / 7));

scheme('extendedColorScale', extendedColorScale);
