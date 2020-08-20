<script>
  import Vega from './Vega.svelte';
  import lineSpec from './LineChart.json';

  export let data = [];
  const spec = lineSpec;
</script>

<Vega {data} on: {spec} />
