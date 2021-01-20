<script>
  import Vega from '../../components/Vega.svelte';
import { addMissing, fetchTimeSlice } from '../../data';
import { defaultRegionOnStartup, sensorList } from '../../stores/constants';

  const sensor = sensorList.find((d) => d.isCasesOrDeath);
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    title: sensor.name,
    height: 500,
    padding: {
      left: 100,
      bottom: 20,
      top: 10,
      right: 10,
    },
    data: {
      name: 'values'
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
          formatType: 'time'
        }
      },
      y: {
        field: 'value',
        type: 'quantitative',
        axis: {
          grid: true,
          title: null,
          domain: false,
        },
        scale: {
          round: true,
          zero: false,
          padding: 50,
        }
      }
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
        align: 'left',
        anchor: 'start',
        fontWeight: 'normal',
        fontSize: 32
      }
    }
  };
  const data = fetchTimeSlice(sensor, 'county', defaultRegionOnStartup.county, new Date(2020, 12-1, 24)).then((r) => addMissing(r, sensor));
</script>

<style>
</style>

<h2>Data Journalist Chart</h2>

<Vega {spec} {data} />
