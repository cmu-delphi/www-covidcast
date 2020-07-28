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

export function pairAdjacent(arr) {
  return new Array(arr.length - 1).fill(0).map((x, i) => [arr[i], arr[i + 1]]);
}
