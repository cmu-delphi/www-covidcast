<script>
  import Vega from '../../components/Vega.svelte';
  import { formatDateISO } from '../../formats';
  import { generateStateMapWithCountyBinaryDataSpec } from '../../specs/mapSpec';
  import DownloadMenu from '../mobile/components/DownloadMenu.svelte';

  /**
   * @type {{name: string}}
   */
  export let signal;
  /**
   * @type {Date}
   */
  export let date;

  export let data;

  const spec = generateStateMapWithCountyBinaryDataSpec();

  let vegaRef = null;
</script>

<div class="chart-aspect-4-3">
  <Vega bind:this={vegaRef} {spec} {data} />
  <DownloadMenu
    {vegaRef}
    {data}
    absolutePos
    fileName="{signal.name}_US Counties_{formatDateISO(date.value)}"
    advanced={false}
  />
</div>
