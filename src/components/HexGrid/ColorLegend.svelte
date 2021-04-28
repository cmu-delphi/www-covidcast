<script>
  import { scaleLinear } from 'd3-scale';
  import { stats } from '../../stores';
  /**
   * @type {import('../../stores/params').SensorParam}
   */
  export let sensor;

  export let gradientLength = 280;
  export let gradientThickness = 8;

  export let value = null;

  export let level = 'state';

  $: scale = sensor.createColorScale($stats, level);

  $: linearScale = scale.copy().rangeRound([0, 100]);

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

<div class="legend">
  <div
    class="gradient"
    style="width: {gradientLength}px; background-image: {gradient(
      scale,
      gradientLength,
    )}; padding-top: {gradientThickness}px; background-size: 100% {gradientThickness}px"
  >
    {#if value}
      {#await value then v}
        {#if v != null}
          <div class="tick-highlight" style="left: {linearScale(v)}%">{sensor.formatValue(v)}</div>
        {/if}
      {/await}
    {/if}
    {#each scale.ticks(5) as tick}
      <div class="tick" data-tick={sensor.formatValue(tick)} />
    {/each}
  </div>
  <slot />
</div>

<style>
  .legend {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1em;
    position: relative;
  }
  .gradient {
    background-position: top;
    background-repeat: no-repeat;
    display: flex;
    justify-content: space-between;
    position: relative;
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
    top: 2px;
    transform: translateX(-50%);
  }

  .tick-highlight {
    position: absolute;
    font-size: 0.75rem;
    transform: translate(-50%, 0);
    text-align: center;
    bottom: 100%;
  }

  .tick-highlight::before {
    content: '▼';
    font-size: 0.5rem;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -3px);
  }
</style>
