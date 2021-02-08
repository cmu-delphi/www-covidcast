<script>
  import Vega from '../../components/Vega.svelte';
  import { addMissing, fetchTimeSlice, averageByDate } from '../../data';
  import { getInfoByName, nationInfo } from '../../maps';
  import getRelatedCounties from '../../maps/related';
  import HistoryLineTooltip from './HistoryLineTooltip.svelte';
  import { generateCompareLineSpec, generateLineChartSpec, signalPatches } from '../../specs/lineSpec';

  export let height = 150;

  export let className = '';
  /**
   * @type {import("../utils").Params}
   */
  export let params;

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @param {import('../../maps').NameInfo} region
   * @param {Date} date
   */
  function genSpec(region, date, height) {
    const options = { 
      initialDate: date,
      height,
    };
    if (region.level === 'state') {
      // state vs nation
      return generateCompareLineSpec([region.displayName, nationInfo.displayName], options);
    }
    if (region.level === 'county') {
      // county vs related vs state vs nation
      const state = getInfoByName(region.state);
      return generateCompareLineSpec(
        [region.displayName, 'Related Counties', state.displayName, nationInfo.displayName],
        options,
      );
    }
    // nation
    return generateLineChartSpec({ initialDate: date });
  }

  /**
   * @param {import('../../stores/constants').SensorEntry} sensor
   * @param {import("../utils").Params} params
   */
  function loadData(sensor, params) {
    const region = params.region;
    const selfData = fetchTimeSlice(sensor, region.level, region.propertyId, undefined, undefined, false, {
      displayName: region.displayName,
    }).then((r) => addMissing(r, sensor));
    const nationData = fetchTimeSlice(sensor, nationInfo.level, [nationInfo.propertyId], undefined, undefined, false, {
      displayName: nationInfo.displayName,
    }).then((r) => addMissing(r, sensor));

    const data = [selfData, nationData];

    if (params.region.level === 'county') {
      const state = getInfoByName(region.state);
      const stateData = fetchTimeSlice(sensor, state.level, [state.propertyId], undefined, undefined, false, {
        displayName: state.displayName,
      }).then((r) => addMissing(r, sensor));

      const related = getRelatedCounties(region);
      const relatedData = fetchTimeSlice(
        sensor,
        'county',
        related.map((d) => d.propertyId).join(','),
        undefined,
        undefined,
        false,
        {
          displayName: 'Related Counties',
        },
      )
        .then((r) => averageByDate(r, sensor))
        .then((r) => addMissing(r, sensor));

      data.push(stateData, relatedData);
    }
    return Promise.all(data).then((rows) => rows.flat());
  }

  $: spec = genSpec(params.region, params.date, height);
  $: data = loadData(sensor, params);
</script>

<Vega {className} {spec} {data} tooltip={HistoryLineTooltip} signals={signalPatches} />
