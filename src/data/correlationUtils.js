/**
 * (separate file for better bundling)
 * @param {number} lag
 * @returns string
 */
export function lagToOffset(lag, wrapped = true) {
  const wrap = wrapped ? (v) => ` (${v})` : (v) => ` ${v}`;
  if (lag === 1) {
    return wrap('1 day later');
  }
  if (lag > 1) {
    return wrap(`${lag} days later`);
  }
  if (lag === -1) {
    return wrap('1 day earlier');
  }
  if (lag < -1) {
    return wrap(`${lag} days earlier`);
  }
  return '';
}
