'use strict';

const fs = require('fs');

let rawdata = fs.readFileSync('counties-simple.json');
let student = JSON.parse(rawdata);
student.features.forEach((d) => {
  delete d.properties.STATE;
  delete d.properties.COUNTY;
  delete d.properties.CENSUSAREA;
  delete d.properties.LSAD;
});
console.log(student.features.map((d) => d.properties));

fs.writeFileSync('./counties-simple-props.json', JSON.stringify(student));
