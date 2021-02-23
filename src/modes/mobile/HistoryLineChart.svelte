<script>
  import Vega from '../../components/Vega.svelte';
  import { addMissing, averageByDate } from '../../data';
  import { getInfoByName, nationInfo } from '../../maps';
  import getRelatedCounties from '../../maps/related';
  import HistoryLineTooltip from './HistoryLineTooltip.svelte';
  import { generateCompareLineSpec, generateLineChartSpec, signalPatches } from '../../specs/lineSpec';

  export let height = 150;

  export let className = '';
  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/params").SensorParam}
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
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").RegionParam} region
   */
  function loadData(sensor, region, date) {
    if (!region.value || !date.value) {
      return null;
    }
    const selfData = region.fetchTimeSeries(sensor.value);

    const data = [selfData];
    if (region.level !== 'nation') {
      data.push(sensor.fetchTimeSeries(nationInfo));
    }

    if (region.level === 'county') {
      const state = getInfoByName(region.state);
      const stateData = sensor.fetchTimeSeries(state);
      const related = getRelatedCounties(region.value);
      const relatedData = sensor
        .fetchMultiTimeSeries(related)
        .then((r) =>
          averageByDate(r, sensor, {
            displayName: 'Related Counties',
          }),
        )
        .then((r) => addMissing(r, sensor));
      data.push(stateData, relatedData);
    }
    return Promise.all(data).then((rows) => rows.flat());
  }

  $: spec = genSpec(region.value, date.value, height);
  $: data = loadData(sensor, region, date);
</script>

<Vega {className} {spec} {data} tooltip={HistoryLineTooltip} signals={signalPatches} />
