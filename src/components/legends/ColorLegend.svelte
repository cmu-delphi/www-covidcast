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
  import { MISSING_COLOR, ZERO_COLOR } from '../../theme';

  $: r = generateLabels(
    $stats,
    $currentSensorEntry,
    $currentLevel,
    $colorScale,
    $signalCasesOrDeathOptions,
    $isMobileDevice,
  );
</script>

<ul data-testid="color-legend">
  <li
    class="tick tick-single"
    style="background:repeating-linear-gradient(-45deg, {MISSING_COLOR}, white 30%)"
    title="NA"
  >
    {r.high}
  </li>
  <li class="tick tick-single tick-space" style="background-color: {ZERO_COLOR}" title={r.low}>{r.high}</li>
  {#each r.labels as l}
    <li class="tick" style="background-image: linear-gradient(to right, {l.color}, {l.nextColor})" title={l.label}>
      {r.high}
    </li>
  {/each}
  <li class="tick tick-last" title={r.high} />
</ul>

<style>
  ul {
    margin: 0;
    margin-right: 2em;
    padding: 0 0 0 0;
    display: flex;
    width: 48vw;
    max-width: 536px;
    font-size: 0.72em;
    user-select: none;
  }

  @media only screen and (max-width: 767px) {
    ul {
      width: auto;
    }
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
    line-height: 1;
  }

  .tick-last {
    flex: 0.5;
  }

  .tick::after {
    content: attr(title);
    position: absolute;
    top: 120%;
    left: 0;
    transform: translate(-50%, 0);
    text-align: center;
    color: #666;
  }

  .tick-space {
    margin-right: 2em;
  }

  .tick-single::after {
    width: 100%;
    transform: unset;
  }
</style>
