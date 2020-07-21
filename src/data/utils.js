// combining json with same geolocations but different value properties
// json1 value is 7 day average, json2 value is single count
export function extend(json1, json2) {
  const newEpiData = [];
  const data1 = json1.epidata;
  const data2 = json2.epidata;
  for (let i = 0; i < data1.length; i++) {
    const avg = Math.max(0, data1[i].value);
    const count = Math.max(0, data2[i].value);
    data1[i].avg = avg;
    delete data1[i].value;
    data1[i].count = count;
    newEpiData.push(data1[i]);
  }
  return newEpiData;
}

export function check_wip(signalName, otherSignal) {
  if (signalName.match(/wip/)) {
    return 'wip_' + otherSignal.replace('incidence', 'incid');
  }
  return otherSignal;
}
