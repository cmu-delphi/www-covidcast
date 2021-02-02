<script>
  import { primaryValue } from '../../stores/constants';
  import Vega from '../../components/Vega.svelte';

  /**
   * @type {null | Promise<import("../../data").EpiDataRow[]>}
   */
  export let data;

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  $: valueKey = primaryValue(sensor, {});

  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  $: spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: { name: 'values' },
    height: 30,
    padding: { left: 2, top: 2, bottom: 2, right: 2 },
    autosize: {
      type: 'none',
      contains: 'padding',
      resize: true,
    },
    encoding: {
      x: {
        field: 'date_value',
        type: 'temporal',
        axis: null,
      },
      y: {
        field: valueKey,
        type: 'quantitative',
        scale: {
          zero: 0,
        },
        axis: null,
      },
    },
    layer: [
      {
        mark: {
          type: 'line',
          interpolate: 'linear',
        },
      },
      {
        mark: {
          opacity: 0,
          type: 'point',
          tooltip: true,
        },
      },
    ],
    config: {
      customFormatTypes: true,
      view: {
        stroke: null,
      },
      legend: {
        disable: true,
      },
    },
  };
</script>

<Vega {spec} {data} />
