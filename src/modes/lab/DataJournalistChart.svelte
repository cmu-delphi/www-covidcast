<script>
  import { timeDay } from 'd3-time';
import Tooltip from '../../components/MapBox/Tooltip.svelte';
  import Vega from '../../components/Vega.svelte';
  import { addMissing, fetchTimeSlice } from '../../data';
  import { defaultRegionOnStartup, sensorList } from '../../stores/constants';
  import {sequenceGen} from './seq';

  const sensor = sensorList.find((d) => d.isCasesOrDeath);
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    title: sensor.name,
    height: 300,
    padding: {
      left: 100,
      bottom: 20,
      top: 10,
      right: 10,
    },
    data: {
      name: 'values',
    },
    encoding: {
      x: {
        field: 'date_value',
        type: 'temporal',
        axis: {
          title: null,
          grid: false,
          format: '%b %d',
          formatType: 'time',
          labelFontSize: 14,
          // tickCount: {
          //   interval: 'day',
          // },
        },
        scale: {},
      },
      y: {
        field: 'value',
        type: 'quantitative',
        axis: {
          grid: true,
          title: null,
          domain: false,
          tickCount: 5,
          labelFontSize: 14,
        },
        scale: {
          round: true,
          zero: false,
          domainMin: null,
          padding: {
            // in case the values are close to 0 .. no padding otherwise some padding
            // if range.min < 10 && range.range > 30 ? 0 : 20
            expr: `customObjChecks(customExtent(data("values"), "value"), ['min', '<', 10], ['range', '>', 30]) ? 0 : 20`
          },
        },
      },
    },
    layer: [
      {
        mark: {
          type: 'line',
          point: false,
        },
      },
      {
        mark: {
          type: 'point',
          stroke: null,
          fill: 'steelblue',
          tooltip: true,
        },
      },
    ],
    config: {
      view: {
        stroke: null,
      },
      axis: {
        // labelFont: 20,
        // tickMinStep: 10,
      },
      title: {
        anchor: 'start',
        fontWeight: 'normal',
        fontSize: 32,
      },
    },
  };

  function gen(min, max, seed) {
    const seq = sequenceGen(min, max, seed);
    return timeDay.range(new Date(2020, 12 - 1, 1), new Date(), 1).map((date_value) => ({
      date_value,
      value: seq(),
    }));
  }

  // const data = fetchTimeSlice(sensor, 'county', defaultRegionOnStartup.county, new Date(2020, 12 - 1, 1), new Date()).then((r) =>
  //   addMissing(r, sensor),
  // );

  const dataWide = gen(0, 100);
  const dataWide2 = gen(0, 100, "x");
  const dataLowBand = gen(3, 8);
  const dataMidBand = gen(30, 60);
  const dataHighBand = gen(87, 92);
</script>

<style>
</style>

<h2>Data Journalist Chart</h2>

<Vega {spec} data={dataWide} />
<Vega {spec} data={dataWide2} />
<Vega {spec} data={dataLowBand} />
<Vega {spec} data={dataMidBand} />
<Vega {spec} data={dataHighBand} />

