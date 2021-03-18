<script>
  import { modeByID } from '..';
  import { currentMode, currentSensor } from '../../stores';
  import { scrollToTop } from '../../util';

  export let group;

  function showDetails(sensor) {
    currentSensor.set(sensor.key);
    currentMode.set(modeByID.indicator);
    scrollToTop();
  }

  $: label = `${group.label}${group.label.endsWith('Indicators') ? '' : ' Indicators'}`;
  $: sensors = group.sensors
    .filter((d) => d.highlight && d.highlight.includes('landing'))
    .sort((a, b) => {
      if (a.isCasesOrDeath) {
        return b.isCasesOrDeath ? a.name.localeCompare(b.name) : -1;
      }
      if (b.isCasesOrDeath) {
        return 1;
      }
      return -a.name.localeCompare(b.name);
    });
</script>

<li>
  <strong>{group.sensors.length} {label}</strong>
  like
  {#each sensors as sensor, i}
    {i === sensors.length - 1 ? ' and' : i > 0 ? ',' : ''}
    <a href="?mode={modeByID.indicator.id}&sensor={sensor.key}" on:click|preventDefault={() => showDetails(sensor)}
      >{sensor.name}</a
    >
  {/each}
</li>
