<script>
  import Vega from '../../components/Vega.svelte';
  import { addMissing, fetchTimeSlice } from '../../data';
  import { getInfoByName, nationInfo } from '../../maps';
  import getRelatedCounties from '../../maps/related';
  import { currentDateObject } from '../../stores';
  import { defaultRegionOnStartup, DEFAULT_SURVEY_SENSOR, sensorMap } from '../../stores/constants';

  import { generateLineChartSpec } from './lineSpec';

  const sensor = sensorMap.get(DEFAULT_SURVEY_SENSOR);

  const county = getInfoByName(defaultRegionOnStartup.county);
  const related = getRelatedCounties(county);
  const state = getInfoByName(county.state);
  const nation = nationInfo;

  const spec = generateLineChartSpec('Random', true, $currentDateObject);
  spec.title = null;
  spec.padding.bottom = 50;
  spec.layer[0].encoding.color = {
    field: 'displayName',
    type: 'nominal',
    scale: {
      domain: [county.displayName, 'Related Counties', state.displayName, nation.displayName],
    },
    legend: {
      direction: 'horizontal',
      orient: 'bottom',
      title: null,
      symbolType: 'stroke',
      symbolStrokeWidth: {
        expr: `datum.label === "${county.displayName}" ? 3 : 1`,
      },
    },
  };
  spec.layer[0].encoding.strokeWidth = {
    condition: {
      test: `datum.displayName === "${county.displayName}"`,
      value: 3,
    },
    value: 1,
  };
  spec.layer[1].encoding.color = {
    field: 'displayName',
    type: 'nominal',
  };

  const start = new Date(2020, 12 - 1, 1);
  const end = new Date();

  function loadData() {
    const countyData = fetchTimeSlice(sensor, 'county', county.propertyId, start, end, false, {
      displayName: county.displayName,
    }).then((r) => addMissing(r, sensor));

    const relatedData = fetchTimeSlice(
      sensor,
      'county',
      related.map((d) => d.propertyId).join(','),
      start,
      end,
      false,
      {
        displayName: 'Related Counties',
      },
    )
      .then((r) => {
        // average by date
        const byDate = new Map();
        for (const row of r) {
          const key = row.time_value;
          if (byDate.has(key)) {
            byDate.get(key).push(row);
          } else {
            byDate.set(key, [row]);
          }
        }
        return Array.from(byDate.values())
          .map((rows) => {
            const base = rows[0];
            return {
              ...base,
              value: rows.reduce((acc, v) => acc + v.value, 0) / rows.length,
            };
          })
          .sort((a, b) => a.time_value - b.time_value);
      })
      .then((r) => addMissing(r, sensor));

    const nationData = fetchTimeSlice(sensor, nation.level, [nation.propertyId], start, end, false, {
      displayName: nation.displayName,
    }).then((r) => addMissing(r, sensor));
    const stateData = fetchTimeSlice(sensor, state.level, [state.propertyId], start, end, false, {
      displayName: state.displayName,
    }).then((r) => addMissing(r, sensor));

    return Promise.all([countyData, nationData, stateData, relatedData]).then((rows) => rows.flat());
  }

  const data = loadData(county);
</script>

<style>
</style>

<h2>{county.displayName} - {sensor.name}</h2>

Related Counties:
{getRelatedCounties(county)
  .map((d) => d.displayName)
  .join(', ')}

<Vega {spec} {data} />
