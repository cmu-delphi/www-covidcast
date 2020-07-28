import * as d3 from 'd3';
import colorParse from 'color-parse';
import invertColor from 'invert-color';

export const calculateValFromRectified = (rectified) => {
  let tempDate = new Date(rectified);
  let year = tempDate.getFullYear();
  let month = ('0' + (tempDate.getMonth() + 1)).slice(-2);
  let date = ('0' + tempDate.getDate()).slice(-2);
  return year + month + date;
};

export const injectIDs = (level, data) => {
  // var lst = [];
  data.features.forEach((d) => {
    d.properties.level = level;
    if (level === 'county') {
      d.id = d.properties.id = d.properties.GEO_ID.slice(-5);
    } else if (level === 'msa') {
      d.id = d.properties.id = d.properties.cbsafp;
    } else if (level === 'state') {
      d.properties.id = d.properties.POSTAL;
      d.id = d.properties.STATE;
    } else if (level === 'county-centers') {
      d.id = d.properties.GEO_ID.slice(-5);
    } else if (level == 'msa-centers') {
      d.id = d.properties.id;
    } else if (level == 'state-centers') {
      d.id = d.properties.STATE;
    }
  });
  return data;
};

export function getTextColorBasedOnBackground(bgColor) {
  // https://github.com/onury/invert-color
  return invertColor(colorParse(bgColor).values, {
    black: '#000',
    white: '#fff',
    threshold: 0.32,
  });
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
    return [a, b, base];
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
    return [a, b];
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
    return [a, b];
  };

  return scale;
}

export function zip(a1, a2) {
  return a1.map((value, index) => [value, a2[index]]);
}

export function transparent(colors, opacity) {
  if (!Array.isArray(colors)) {
    return transparent([colors], opacity)[0];
  }

  return colors.map((c) => {
    const rgba = d3.rgb(c);
    rgba.opacity = opacity;
    return rgba.toString();
  });
}
