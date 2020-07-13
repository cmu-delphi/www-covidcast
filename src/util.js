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

export function getNiceNumber(num) {
  let nice = Math.pow(10, Math.ceil(Math.log10(num)));

  if (num < 0.25 * nice) nice = 0.25 * nice;
  else if (num < 0.5 * nice) nice = 0.5 * nice;

  return nice;
}

export const defaultRegionOnStartup = {
  county: '42003', // Allegheny
  msa: '38300', // Pittsburgh
  state: 'PA', // Pennsylvania
};
