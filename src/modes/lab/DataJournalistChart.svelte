<script>
  import { timeDay } from 'd3-time';
  import Vega from '../../components/Vega.svelte';
  import { addMissing, fetchTimeSlice } from '../../data';
  import { defaultRegionOnStartup, sensorList } from '../../stores/constants';

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
    mark: {
      type: 'line',
      pont: false,
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
          tickCount: {
            interval: 'day',
          },
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
          // domainMin: 0,
          // padding: 50,
        },
      },
    },
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

  function rnd(min, max) {
    const v = Math.random();
    return min + v * (max - min);
  }

  function gen() {
    return timeDay.range(new Date(2020, 12 - 1, 1), new Date(), 1).map((date_value) => ({
      date_value,
      value: rnd(840, 880),
    }));
  }

  const data = gen();
</script>

<style>
</style>

<h2>Data Journalist Chart</h2>

<Vega {spec} {data} />
