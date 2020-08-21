<script>
  import {
    colorScale,
    currentLevel,
    currentSensorEntry,
    stats,
    signalCasesOrDeathOptions,
    isMobileDevice,
  } from '../../stores';
  import { generateLabels } from '../MapBox/colors';
  import { DIRECTION_THEME } from '../../theme';

  export let loading = false;

  $: r = generateLabels(
    $stats,
    $currentSensorEntry,
    $currentLevel,
    $colorScale,
    $signalCasesOrDeathOptions,
    $isMobileDevice,
  );
</script>

<style>
  ul {
    margin: 0;
    padding: 0 2em 0 1em;
    display: flex;
    font-size: 80%;
  }

  .tick {
    border-left: 1px solid white;
    margin: 0;
    padding: 0;
    list-style: none;
    flex: 2 2 0;
    margin-bottom: 1.2em;
    position: relative;
    color: transparent;
    white-space: nowrap;
  }

  .tick-last {
    flex: 1 1 0;
  }

  .tick::after {
    content: attr(title);
    position: absolute;
    top: 100%;
    left: 0;
    transform: translate(-50%, 0);
    text-align: center;
    color: #666;
  }
</style>

<ul class:loading-bg={loading}>
  <li class="tick" style="background-color: {DIRECTION_THEME.countMin}" title={r.low}>{r.high}</li>
  {#each r.labels as l}
    <li class="tick" style="background-image: linear-gradient(to right, {l.color}, {l.nextColor})" title={l.label}>
      {r.high}
    </li>
  {/each}
  <li class="tick tick-last" title={r.high} />
</ul>
