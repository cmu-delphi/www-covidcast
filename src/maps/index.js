export * from './infos';
import { stateInfo, countyInfo, msaInfo, hrrInfo, levelMegaCountyId } from './infos';

export function loadSources(additionalProperties = {}) {
  // mark to be loaded as fast as possible
  return import(/* webpackPreload: true */ './geo').then((r) =>
    r.default(stateInfo, countyInfo, msaInfo, hrrInfo, levelMegaCountyId, additionalProperties),
  );
}
