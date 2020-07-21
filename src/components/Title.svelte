<script>
  import { sensorMap, currentSensor } from '../stores';

  $: currentSensorTooltip = $sensorMap.get($currentSensor).mapTitleText;
</script>

<style>
  .banner {
    font-size: 1.3rem;
    line-height: 1.2em;
    font-weight: 600;
    text-align: center;
  }
</style>

<h2 class="banner">{currentSensorTooltip}</h2>
