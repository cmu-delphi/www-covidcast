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
  data.features.forEach((d) => {
    d.properties.level = level;

    if (level === 'county') {
      d.id = d.properties.id = d.properties.GEO_ID.slice(-5);
    } else if (level === 'msa') {
      d.id = d.properties.id = d.properties.cbsafp;
    } else if (level === 'state') {
      d.properties.id = d.properties.POSTAL;
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
    threshold: 0.32
  });
}

export const defaultRegionOnStartup = {
  county: '42003', // Allegheny
  msa: '38300', // Pittsburgh
  state: 'PA', // Pennsylvania
};