/**
 * (separate file for better bundling)
 * @returns string
 */
export function lagToOffset(lag: number, wrapped = true): string {
  const wrap = wrapped ? (v: string) => ` (${v})` : (v: string) => ` ${v}`;
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
