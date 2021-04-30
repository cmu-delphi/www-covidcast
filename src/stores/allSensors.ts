import { sensorList, Sensor, groupedSensorList } from './constants';
import { questions } from './questions';

const { map: allSensorsMap, list: allSensorsList, grouped: allSensorsGrouped } = (() => {
  const map = new Map<string, Sensor>();
  for (const s of sensorList) {
    map.set(s.key, s);
  }
  const grouped: { label: string; sensors: Sensor[] }[] = groupedSensorList.slice();
  const fbSurvey = { label: questions[0].sensor.dataSourceName, sensors: [] as Sensor[] };
  for (const q of questions) {
    if (!map.has(q.sensor.key)) {
      fbSurvey.sensors.push(q.sensor);
      map.set(q.sensor.key, q.sensor);
    }
  }
  grouped.push(fbSurvey);
  return {
    map,
    list: [...map.values()].sort((a, b) => a.name.localeCompare(b.name)),
    grouped,
  };
})();

export { allSensorsMap, allSensorsList, allSensorsGrouped };
