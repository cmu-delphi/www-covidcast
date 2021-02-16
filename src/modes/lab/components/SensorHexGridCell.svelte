<script>
  import HexGridCell from './HexGridCell.svelte';
  import HistoryLineChart from '../../mobile/HistoryLineChart.svelte';

  /**
   * @type {import("../../../stores/constants").SensorEntry}
   */
  export let sensor;
  /**
   * @type {import('../mobile/utils').Params}
   */
  export let params;

  export let style = '';
  export let className = '';

  export let x = -1;
  export let y = -1;
  export let border = 0;
</script>

<style>
</style>

<HexGridCell {x} {y} {style} {className} {border} on:>
  <header>
    <h4>{sensor.name}</h4>
  </header>
  <main>
    <HistoryLineChart {params} {sensor} />
  </main>
  <footer></footer>
</HexGridCell>
