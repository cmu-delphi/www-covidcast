<script>
  import { colorScale, currentLevel, currentSensorEntry, stats, signalCasesOrDeathOptions } from '../../stores';
  import { generateLabels } from '../MapBox/colors';
  import { DIRECTION_THEME } from '../../theme';
  import './ticks.css';

  export let loading = false;

  $: r = generateLabels($stats, $currentSensorEntry, $currentLevel, $colorScale, $signalCasesOrDeathOptions);
</script>

<style>
  li.tick {
    border-left: 1px solid white;
  }
</style>

<ul class="legend-ticks" class:loading-bg={loading}>
  <li class="legend-tick-space" />
  <li class="legend-tick tick" style="background-color: {DIRECTION_THEME.countMin}" title={r.low} />
  {#each r.labels as l}
    <li
      class="legend-tick tick"
      style="background-image: linear-gradient(to right, {l.color}, {l.nextColor})"
      title={l.label} />
  {/each}
  <li class="legend-tick-space legend-tick tick" title={r.high} />
</ul>
