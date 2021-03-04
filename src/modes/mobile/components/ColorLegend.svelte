<script>
  import { scaleLinear } from 'd3-scale';
  import { stats } from '../../../stores';
  /**
   * @type {import('../../../stores/constants').SensorEntry}
   */
  export let sensor;

  export let gradientLength = 300;
  export let gradientThickness = 8;

  export let level = 'state';

  $: scale = sensor.createColorScale($stats, level);

  function gradient(scale, gradientLength) {
    const samples = Math.floor(gradientLength / 30); // every 30px
    const color = scale.copy().domain([0, samples - 1]);
    const toPercent = scaleLinear()
      .domain([0, samples - 1])
      .rangeRound([0, 100]);
    const steps = Array(samples)
      .fill(0)
      .map((_, i) => `${color(i)} ${toPercent(i)}%`);
    return `linear-gradient(to right, ${steps.join(', ')})`;
  }
</script>

<style>
  .legend {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .gradient {
    background-position: top;
    background-repeat: no-repeat;
    display: flex;
    justify-content: space-between;
  }
  .tick {
    position: relative;
    overflow: visible;
    width: 1px;
    border-top: 3px solid currentColor;
    height: 1.2em;
    font-size: 0.75rem;
    line-height: 1;
  }
  .tick::before {
    content: attr(data-tick);
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
  }
</style>

<div class="legend">
  <div
    class="gradient"
    style="width: {gradientLength}px; background-image: {gradient(scale, gradientLength)}; padding-top: {gradientThickness}px; background-size: 100% {gradientThickness}px">
    {#each scale.ticks(5) as tick}
      <div class="tick" data-tick={sensor.formatValue(tick)} />
    {/each}
  </div>
</div>
