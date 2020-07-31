<script>
  import Vega from './Vega.svelte';
  import lineSchema from './LineChart.json';

  export let data = [];
  const schema = lineSchema;
</script>

<Vega {data} on: {schema} />
