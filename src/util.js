import colorParse from 'color-parse';
import invertColor from 'invert-color';
import { scaleLinear } from 'd3';

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
      /*
        lst.push({
          'display_name': d.properties.NAME + " County, " + dict[d.properties.STATE],
          'name': d.properties.NAME,
          'id': d.id,
          'property_id': d.properties.id,
          'level': level
        })
      */
    } else if (level === 'msa') {
      d.id = d.properties.id = d.properties.cbsafp;
      /*
        lst.push({
          'display_name': d.properties.NAME,
          'name': d.properties.NAME,
          'id': d.id,
          'property_id': d.properties.id,
          'level': level
        })
      */
    } else if (level === 'state') {
      d.properties.id = d.properties.POSTAL;
      d.id = d.properties.STATE;
      /*
        dict[d.id] = d.properties.POSTAL

        lst.push({
          'display_name': d.properties.NAME,
          'name': d.properties.NAME,
          'id': d.id,
          'property_id': d.properties.id,
          'level': level
        })
      */
    } else if (level === 'county-centers') {
      d.id = d.properties.GEO_ID.slice(-5);
    } else if (level == 'msa-centers') {
      d.id = d.properties.id;
    } else if (level == 'state-centers') {
      d.id = d.properties.STATE;
    }
    //console.log(d)
    //lst.push({
    //  'name': d.properties.NAME,
    //  'id': d.id,
    //  'property_id': d.properties.id
    //})
  });
  //console.log(lst);
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
// Because MapBox does not support applying a custom function for a property,
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

export const defaultRegionOnStartup = {
  county: '42003', // Allegheny
  msa: '38300', // Pittsburgh
  state: 'PA', // Pennsylvania
};

export function flatten(arr) {
  return arr.reduce((acc, val) => acc.concat(val), []);
}
