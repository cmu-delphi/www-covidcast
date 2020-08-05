import logspace from 'compute-logspace';
import { isCountSignal } from '../../data/signals';
import { pairAdjacent } from '../../util';
import { determineMinMax } from '../MapBox/colors';

export function splitDomain(min, max, parts) {
  const splits = [min];
  const increment = (max - min) / parts;
  for (let i = 1; i < parts; i++) {
    splits.push(splits[i - 1] + increment);
  }
  splits.push(max);
  return splits;
}

export function getSigfigs(value, sigFigs) {
  return parseFloat(parseFloat(value).toPrecision(sigFigs));
}

function arr2labels(arr) {
  const labels = [];
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Number.parseFloat(arr[i]).toFixed(2);
    labels.push(arr[i]);
  }
  return labels;
}

export function generateLabels(stats, sensorEntry, level) {
  const valueMinMax = stats ? determineMinMax(stats, sensorEntry.key, level) : null;

  if (!valueMinMax) {
    return {
      labels: [],
      high: '',
      unit: '',
      valueMinMax: [0, 0],
    };
  }

  let high = getSigfigs(valueMinMax[1].toFixed(2), 3);
  let unit = '';

  if (isCountSignal(sensorEntry.key)) {
    const min = Math.log(valueMinMax[0]) / Math.log(10);
    const max = Math.log(valueMinMax[1]) / Math.log(10);
    const arr = logspace(min, max, 7);

    const labels = ['0', ...arr2labels(arr)];
    return {
      labels: pairAdjacent(labels),
      high,
      unit,
      valueMinMax,
    };
  }

  if (sensorEntry.format === 'raw') {
    valueMinMax[0] = Math.max(0, valueMinMax[0]);
  } else {
    // otherwise, it's 'percent'.
    high = getSigfigs(Math.min(100, valueMinMax[1]).toFixed(2), 3);
    unit = '%';
    valueMinMax[0] = Math.max(0, valueMinMax[0]);
    valueMinMax[1] = Math.min(100, valueMinMax[1]);
  }

  const arr = splitDomain(valueMinMax[0], valueMinMax[1], 7);
  const labels = arr2labels(arr);

  return {
    labels: pairAdjacent(labels),
    high,
    unit,
    valueMinMax,
  };
}
