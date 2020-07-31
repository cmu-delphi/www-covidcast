<script>
  import Vega from './Vega.svelte';
  /**
   * @typedef {import('../stores/fetchData').EpiDataRow} EpiDataRow
   */

  /**
   * @type {EpiDataRow[]}
   */
  export let data = [];

  export const schema = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: {
      values: null,
    },
    // mark: 'line',
    encoding: {
      color: {
        value: 'grey',
      },
      x: {
        field: 'time_value',
        type: 'temporal',
        axis: null,
      },
      y: {
        field: 'value',
        type: 'quantitative',
        axis: null,
      },
    },
    layer: [
      {
        mark: {
          type: 'line',
          interpolate: 'monotone',
        },
      },
      {
        selection: {
          index: {
            type: 'single',
            on: 'mousemove',
            encodings: ['x'],
            nearest: true,
          },
        },
        mark: { type: 'point' },
        encoding: {
          y: { field: 'value', type: 'quantitative' },
          opacity: { value: 0 },
        },
      },
      {
        transform: [
          {
            filter: {
              and: ['index.date_value', { selection: 'index' }],
            },
          },
        ],
        mark: 'rule',
      },
      {
        transform: [
          {
            filter: {
              and: ['index.date_value', { selection: 'index' }],
            },
          },
        ],
        mark: 'text',
        encoding: {
          y: { value: 10 },
          text: { field: 'date_value', type: 'temporal' },
        },
      },
    ],
  };
</script>

<Vega {data} on: {schema} />
