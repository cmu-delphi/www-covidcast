<script>
  import { colorScale, currentLevel, currentSensorEntry, stats, signalCasesOrDeathOptions } from '../../stores';
  import { generateLabels } from '../MapBox/colors';
  import { DIRECTION_THEME } from '../../theme';

  export let loading = false;

  $: r = generateLabels($stats, $currentSensorEntry, $currentLevel, $colorScale, $signalCasesOrDeathOptions);
</script>

<style>
  ul {
    margin: 0;
    padding: 0;
    display: flex;
    font-size: 80%;
  }

  li {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li.tick {
    flex: 2 2 0;
    min-width: 5em;
    height: 1em;
    margin-bottom: 1em;
    display: flex;
    flex-direction: column;
    position: relative;
    border-left: 1px solid white;
  }

  li.space {
    flex: 1 1 0;
    min-width: 2.5em;
  }

  li.tick::after {
    content: attr(title);
    position: absolute;
    top: 100%;
    left: 0;
    transform: translate(-50%, 0);
    text-align: center;
  }
</style>

<ul class:loading-bg={loading}>
  <li class="space" />
  <li class="tick" style="background-color: {DIRECTION_THEME.countMin}" title={r.low} />
  {#each r.labels as l}
    <li class="tick" style="background-image: linear-gradient(to right, {l.color}, {l.nextColor})" title={l.label} />
  {/each}
  <li class="space tick" title={r.high} />
</ul>
