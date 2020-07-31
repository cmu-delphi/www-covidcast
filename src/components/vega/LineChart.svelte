<script>
  import Vega from './Vega.svelte';
  import lineSchema from './LineChart.json';
  /**
   * @typedef {import('../stores/fetchData').EpiDataRow} EpiDataRow
   */

  /**
   * @type {EpiDataRow[]}
   */
  export let data = [];

  const schema = lineSchema;
</script>

<Vega {data} on: {schema} />
