// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function parseScaleSpec(spec: { type: 'sqrt' | 'log' | 'linear'; base?: number }) {
  switch (spec.type) {
    case 'sqrt':
      return SqrtScale();
    case 'log':
      return LogScale().base(spec.base ?? 10);
    case 'linear':
      return LinearScale();
  }
}

// A d3-like continuous log scale.
// Because MapBox does not support applying a custom function to a property,
// so we cannot use d3.scaleLog().

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function LogScale() {
  let a = 1,
    b = 0,
    base = 10,
    domain = [1, 1],
    range = [0, 0];
  let clamp = false;

  function log(x: number): number {
    return Math.log(x) / Math.log(base);
  }

  function fit() {
    a = (range[1] - range[0]) / (log(domain[1]) - log(domain[0]));
    b = range[0] - a * log(domain[0]);
  }

  // y = a log (x) + b
  function scale(x: number): number {
    return a * log(Math.min(clamp ? domain[1] : Number.POSITIVE_INFINITY, x));
  }

  scale.domain = function (v?: [number, number]) {
    if (v == null) return domain;
    domain = v;
    fit();
    return scale;
  };

  scale.range = function (v?: [number, number]) {
    if (v == null) return range;
    range = v;
    fit();
    return scale;
  };

  scale.base = function (v?: number) {
    if (v == null) return base;
    base = v;
    fit();
    return scale;
  };

  scale.coef = function (va?: number | [number, number, number], vb?: number, vbase?: number) {
    if (va == null) return [a, b, base] as [number, number, number];
    if (Array.isArray(va)) {
      a = va[0];
      b = va[1];
      base = va[2];
    } else {
      a = va;
      b = vb ?? b;
      base = vbase ?? base;
    }
    return scale;
  };

  scale.expr = function (value: number) {
    const baseLog = Math.log10(base);
    const v = clamp ? ['min', value, domain[1]] : value;
    return ['+', ['*', a, ['/', ['log10', v], baseLog]], b];
  };

  scale.clamp = function (v?: boolean) {
    if (v == null) return clamp;
    clamp = v;
    return scale;
  };

  scale.clone = function () {
    return LogScale().coef(scale.coef() as [number, number, number]);
  };
  return scale;
}

// d3-like Squre Root Scale
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function SqrtScale() {
  let a = 1,
    b = 0,
    domain = [1, 1],
    range = [0, 0];
  let clamp = false;

  function sqrt(x: number): number {
    return Math.sqrt(x);
  }

  function fit() {
    a = (range[1] - range[0]) / (sqrt(domain[1]) - sqrt(domain[0]));
    b = range[0] - a * sqrt(domain[0]);
  }

  // y = a log (x) + b
  function scale(x: number): number {
    return a * sqrt(Math.min(clamp ? domain[1] : Number.POSITIVE_INFINITY, x)) + b;
  }

  scale.domain = function (v?: [number, number]) {
    if (v == null) return domain;
    domain = v;
    fit();
    return scale;
  };

  scale.range = function (v?: [number, number]) {
    if (v == null) return range;
    range = v;
    fit();
    return scale;
  };

  scale.coef = function (va?: number | [number, number], vb?: number) {
    if (va == null) return [a, b] as [number, number];
    if (Array.isArray(va)) {
      a = va[0];
      b = va[1];
    } else {
      a = va;
      b = vb!;
    }
    return scale;
  };

  scale.clamp = function (v?: boolean) {
    if (v == null) return clamp;
    clamp = v;
    return scale;
  };

  scale.expr = function (value: number) {
    const v = clamp ? ['min', value, domain[1]] : value;
    return ['+', ['*', a, ['sqrt', v]], b];
  };

  scale.clone = function () {
    return SqrtScale().coef(scale.coef() as [number, number]);
  };

  return scale;
}

// d3-like Linear Scale
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function LinearScale() {
  let a = 1,
    b = 0,
    domain = [1, 1],
    range = [0, 0];
  let clamp = false;

  function fit() {
    a = (range[1] - range[0]) / (domain[1] - domain[0]);
    b = range[0] - a * domain[0];
  }

  // y = a log (x) + b
  function scale(x: number): number {
    return a * Math.min(clamp ? domain[1] : Number.POSITIVE_INFINITY, x) + b;
  }

  scale.domain = function (v?: [number, number]) {
    if (v == null) return domain;
    domain = v;
    fit();
    return scale;
  };

  scale.range = function (v?: [number, number]) {
    if (v == null) return range;
    range = v;
    fit();
    return scale;
  };

  scale.coef = function (va?: number | [number, number], vb?: number) {
    if (va == null) return [a, b] as [number, number];
    if (Array.isArray(va)) {
      a = va[0];
      b = va[1];
    } else {
      a = va;
      b = vb!;
    }
    return scale;
  };

  scale.clamp = function (v?: boolean) {
    if (v == null) return clamp;
    clamp = v;
    return scale;
  };

  scale.expr = function (value: number) {
    const v = clamp ? ['min', value, domain[1]] : value;
    return ['+', ['*', a, v], b];
  };

  scale.clone = function () {
    return LinearScale().coef(scale.coef() as [number, number]);
  };

  return scale;
}
