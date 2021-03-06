/**
 * (separate file for better bundling)
 * @returns string
 */
export function lagToOffset(lag: number, wrapped: boolean | 'zero' = true): string {
  const wrap: (v: string) => string = wrapped === 'zero' ? String : wrapped ? (v) => ` (${v})` : (v) => ` ${v}`;
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
    return wrap(`${-lag} days earlier`);
  }
  if (wrapped === 'zero') {
    return '0 days';
  }
  return '';
}
