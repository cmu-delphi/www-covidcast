<script>
  import { colorScale, currentLevel, currentSensorEntry, stats, signalCasesOrDeathOptions } from '../../stores';
  import { getSigfigs, generateLabels } from '../MapBox/colors';
  import { DIRECTION_THEME } from '../../theme';

  let high = '';
  let unit = '';
  let labels = [];

  export let loading = false;

  $: {
    const r = generateLabels($stats, $currentSensorEntry, $currentLevel, $signalCasesOrDeathOptions);
    labels = r.labels;
    high = r.high;
    unit = r.unit;
  }
</script>

<style>
  ul {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: space-around;
  }

  li.colored {
    display: block;
    float: left;
    width: 43px;
    margin-right: 1px;
    margin-left: 0px;
    padding-top: 0px;
    text-align: left;
    font-size: 80%;
    list-style: none;
  }

  span.colored {
    display: block;
    float: left;
    height: 15px;
    width: 43px;
  }

  li.ends {
    display: block;
    float: left;
    width: 37px;
    margin-right: 1px;
    margin-left: 0px;
    padding-top: 0px;
    text-align: left;
    font-size: 80%;
    list-style: none;
  }

  span.ends {
    display: block;
    float: left;
    height: 15px;
    width: 37px;
  }
</style>

<ul class:loading-bg={loading}>
  {#each labels as [label1, label2]}
    <li class="colored">
      {#if +label1 === 0}
        <span
          class="colored"
          style="background: linear-gradient(to right, {DIRECTION_THEME.countMin}, {DIRECTION_THEME.countMin})" />
      {:else}
        <span
          class="colored"
          style="background: linear-gradient(to right, {$colorScale(+label1)}, {$colorScale(+label2)})" />
      {/if}
      {getSigfigs(label1, 3)}
    </li>
  {/each}
  <li class="ends">
    <span class="ends" style="background: rgba(255, 255, 255, 0.9);" />
    {high ? high + unit + '+' : ''}
  </li>
</ul>
