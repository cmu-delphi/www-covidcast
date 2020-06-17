import colorParse from 'color-parse';
import invertColor from 'invert-color';

export const calculateValFromRectified = (rectified) => {
  let tempDate = new Date(rectified);
  let year = tempDate.getFullYear();
  let month = ('0' + (tempDate.getMonth() + 1)).slice(-2);
  let date = ('0' + tempDate.getDate()).slice(-2);
  return year + month + date;
};

var dict = {
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "72": "PR",
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT"
}

export const injectIDs = (level, data) => {
  var lst = []
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
      dict[d.id] = d.properties.POSTAL
      /*
        lst.push({
          'display_name': d.properties.NAME,
          'name': d.properties.NAME,
          'id': d.id,
          'property_id': d.properties.id,
          'level': level
        })
      */
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
    threshold: 0.32
  });
}

export const defaultRegionOnStartup = {
  county: '42003', // Allegheny
  msa: '38300', // Pittsburgh
  state: 'PA', // Pennsylvania
};