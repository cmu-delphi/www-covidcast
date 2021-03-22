<script>
  export let shape = 'circle';
  export let color;

  const paths = {
    circle: 'M0,1 a 1,1 0 1,0 2,0 a 1,1 0 1,0 -2,0 Z',
    'triangle-down': 'M0,0 L2,0 L1,2 Z',
    'triangle-up': 'M0,2 L2,2 L1,0 Z',
    'triangle-right': 'M0,0 L0,2 L2,1 Z',
    'triangle-left': 'M2,0 L2,2 L0,1 Z',
    diamond: 'M 0,1 L1,0 L2,1 L1,2 Z',
  };

  $: path = paths[shape] || paths.circle;
</script>

<span class="shape-icon">
  <svg viewBox="0 0 2 2" style="fill: {color}">
    <path d={path} />
  </svg>
</span>

<style>
  .shape-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .shape-icon svg {
    fill: currentColor;
    width: 0.5em;
  }
</style>
