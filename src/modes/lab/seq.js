import seedrandom from 'seedrandom';

const rand = seedrandom('a');

function clamp(v, min, max) {
  return Math.max(Math.min(v, max), min);
}

export function rnd(min, max, r = rand) {
  const v = r();
  return min + v * (max - min);
}

export function step(prev, prevUp, min, max, r = rand) {
  const range = max - min;
  const stableRange = range * 0.05;
  const jumpRange = range * 0.15;

  // 70% of going into the same direction
  // 30% if already at the border
  const closeToBorder = (prev >= max && prevUp) || (prev <= min && !prevUp);
  const up = r() < (closeToBorder ? 0.3 : 0.7) ? prevUp : !prevUp;
  // 80% change of doing just a small change
  const changeRange = r() < 0.8 ? stableRange : jumpRange;

  const value = clamp(prev + (up ? 1 : -1) * r() * changeRange, min, max);
  return [value, up];
}

export function sequenceGen(min, max, seed = `${min}-${max}`) {
  const r = seedrandom(seed);
  let value = null;
  let up = null;
  return () => {
    if (value == null) {
      // first
      up = r() < 0.5;
      value = rnd(min, max, r);
    } else {
      [value, up] = step(value, up, min, max, r);
    }
    return value;
  };
}
