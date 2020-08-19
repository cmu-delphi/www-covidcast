export function parseScaleSpec(spec) {
  switch (spec.type) {
    case 'sqrt':
      return SqrtScale();
    case 'log':
      return LogScale().base(spec.base || 10);
    case 'linear':
      return LinearScale();
  }
}

// A d3-like continuous log scale.
// Because MapBox does not support applying a custom function to a property,
// so we cannot use d3.scaleLog().

export function LogScale() {
  let a = 1,
    b = 0,
    base = 10,
    domain = [1, 1],
    range = [0, 0];

  function log(x) {
    return Math.log(x) / Math.log(base);
  }

  function fit() {
    a = (range[1] - range[0]) / (log(domain[1]) - log(domain[0]));
    b = range[0] - a * log(domain[0]);
  }

  // y = a log (x) + b
  function scale(x) {
    return a * log(x) + b;
  }

  scale.domain = function () {
    if (!arguments.length) return domain;
    domain = arguments[0];
    fit();
    return scale;
  };

  scale.range = function () {
    if (!arguments.length) return range;
    range = arguments[0];
    fit();
    return scale;
  };

  scale.base = function () {
    if (!arguments.length) return base;
    base = arguments[0];
    fit();
    return scale;
  };

  scale.coef = function () {
    if (!arguments.length) return [a, b];
    a = arguments[0];
    b = arguments[1];
    base = arguments[2];

    return scale;
  };

  scale.expr = function (value) {
    const baseLog = Math.log10(base);
    return ['+', ['*', a, ['/', ['log10', value], baseLog]], b];
  };

  scale.clone = function () {
    return LogScale().coef(scale.coef());
  };
  return scale;
}

// d3-like Squre Root Scale
export function SqrtScale() {
  let a = 1,
    b = 0,
    domain = [1, 1],
    range = [0, 0];

  function sqrt(x) {
    return Math.sqrt(x);
  }

  function fit() {
    a = (range[1] - range[0]) / (sqrt(domain[1]) - sqrt(domain[0]));
    b = range[0] - a * sqrt(domain[0]);
  }

  // y = a log (x) + b
  function scale(x) {
    return a * sqrt(x) + b;
  }

  scale.domain = function () {
    if (!arguments.length) return domain;
    domain = arguments[0];
    fit();
    return scale;
  };

  scale.range = function () {
    if (!arguments.length) return range;
    range = arguments[0];
    fit();
    return scale;
  };

  scale.coef = function () {
    if (!arguments.length) return [a, b];
    a = arguments[0];
    b = arguments[1];

    return scale;
  };

  scale.expr = function (value) {
    return ['+', ['*', a, ['sqrt', value]], b];
  };

  scale.clone = function () {
    return SqrtScale().coef(scale.coef());
  };

  return scale;
}

// d3-like Linear Scale
export function LinearScale() {
  let a = 1,
    b = 0,
    domain = [1, 1],
    range = [0, 0];

  function fit() {
    a = (range[1] - range[0]) / (domain[1] - domain[0]);
    b = range[0] - a * domain[0];
  }

  // y = a log (x) + b
  function scale(x) {
    return a * x + b;
  }

  scale.domain = function () {
    if (!arguments.length) return domain;
    domain = arguments[0];
    fit();
    return scale;
  };

  scale.range = function () {
    if (!arguments.length) return range;
    range = arguments[0];
    fit();
    return scale;
  };

  scale.coef = function () {
    if (!arguments.length) return [a, b];
    a = arguments[0];
    b = arguments[1];

    return scale;
  };

  scale.expr = function (value) {
    return ['+', ['*', a, value], b];
  };

  scale.clone = function () {
    return LinearScale().coef(scale.coef());
  };

  return scale;
}
