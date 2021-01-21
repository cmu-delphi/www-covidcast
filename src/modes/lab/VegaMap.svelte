<script>
  import Vega from '../../components/Vega.svelte';
  import { fetchRegionSlice } from '../../data';
  import { DEFAULT_SURVEY_SENSOR, sensorMap } from '../../stores/constants';
  import nationJSON from './maps2/nation.json';
  import stateJSON from './maps2/state.json';
  import countyJSON from './maps2/county.json';
  import hrrJSON from './maps2/hrr.json';
  import msaJSON from './maps2/msa.json';
  import {stateInfo, countyInfo, msaInfo, hrrInfo, nationInfo} from '../../maps';

  const sensor = sensorMap.get(DEFAULT_SURVEY_SENSOR);

  function genSpec(level, topoJSON, infos, fixId) {
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      title: `${sensor.name} - ${level}`,
      height: 300,
      padding: {
        left: 10,
        bottom: 10,
        top: 10,
        right: 10,
      },
      projection: {
        type: 'albersUsaTerritories',
      },
      datasets: {
        values: [],
      },
      data: {
        values: topoJSON,
        format: { 
          type: 'topojson',
          feature: level
        },
      },
      transform: [
        ...(fixId ? [{
          calculate: JSON.stringify(fixId),
          as: 'id'
        }] : []),
        {
          lookup: 'id',
          from: {
            data: {
              values: infos
            },
            key: 'id',
            fields: ['propertyId', 'displayName', 'population'],
          },
        },
        {
          calculate: 'lower(datum.propertyId)',
          as: 'propertyId'
        },
        {
          lookup: 'propertyId',
          from: {
            data: {
              name: 'values',
            },
            key: 'geo_value',
            fields: ['value'],
          },
        },
      ],
      mark: {
        type: 'geoshape',
        stroke: '#eaeaea',
        opacity: 1,
        tooltip: { content: 'encoding' },
      },
      encoding: {
        color: {
          condition: [
            { test: 'datum.value === 0', value: 'rgb(242,242,242)' },
            { test: 'datum.value == null', value: 'transparent' }
          ],
          field: 'value',
          type: 'quantitative',
          scale: {
            scheme: 'yelloworangered',
            clamp: true,
          },
          legend: {
            orient: 'right',
            titleAlign: 'center',
            titleFontWeight: 'normal',
            titleOrient: 'left',
            title: 'of 100,000 people',
            labelLimit: 30,
            tickMinStep: 0.1,
          },
        },
      },
      config: {
        // view: {
        //   stroke: null,
        // },
        title: {
          anchor: 'start',
          fontWeight: 'normal',
          fontSize: 32,
        },
      },
    };
    return spec;
  }

  const nationSpec = genSpec('nation', nationJSON, [nationInfo], 'us');
  const stateSpec = genSpec('state', stateJSON, stateInfo);
  const countySpec = genSpec('county', countyJSON, countyInfo);
  const msaSpec = genSpec('msa', msaJSON, msaInfo);
  const hrrSpec = genSpec('hrr', hrrJSON, hrrInfo);

  const nationData = fetchRegionSlice(sensor, 'nation', new Date(2021, 1 - 1, 15));
  const stateData = fetchRegionSlice(sensor, 'state', new Date(2021, 1 - 1, 15));
  const countyData = fetchRegionSlice(sensor, 'county', new Date(2021, 1 - 1, 15));
  const msaData = fetchRegionSlice(sensor, 'msa', new Date(2021, 1 - 1, 15));
  const hrrData = fetchRegionSlice(sensor, 'hrr', new Date(2021, 1 - 1, 15));
</script>

<style>
</style>

<h2>Vega State Map</h2>

<Vega spec={nationSpec} data={nationData} />
<Vega spec={stateSpec} data={stateData} />
<Vega spec={countySpec} data={countyData} />
<Vega spec={msaSpec} data={msaData} />
<Vega spec={hrrSpec} data={hrrData} />
