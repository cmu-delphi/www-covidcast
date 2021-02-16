<script>
  export let style = '';
  export let className = '';

  export let x = -1;
  export let y = -1;

  $: isDefined = x>=0 && y>=0;
</script>

<style>
  .hexgrid__cell {
    /* get right aspect ratio
    padding-top: 28.5% * 2; */
    padding-top: 57%;
    position: relative;
    /* and vertical spacing
    margin-top: 28.5% * 0.5;
    margin-bottom: 28.5% * 0.5; */
    margin: 14.25% 0;

    /* column 2x + shift in odd rows */
    grid-column-end: span 2;
    grid-row-end: span 1;
  }

/*
  .hexgrid__cell_pos {
    /* column 2x + shift in odd rows
    grid-column-start: calc(1 + var(--col) * 2 + var(--col) % 2);
    /* row, shift by one
    grid-row-start: calc(var(--row) + 1);
  }
*/

  .hexgrid__cell_content {
    position: absolute;
    left: 0;
    top: -50%;
    bottom: -50%;
    width: 100%;
    /* hexagon shape */
    clip-path: polygon(0% 25%, 50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
  }
</style>

<div class="hexgrid__cell" style={isDefined ? `grid-column-start: ${1 + x*2 + y % 2}; grid-row-start: ${y + 1}`: ''}>
  <div class="hexgrid__cell_content {className}" {style}>
    <slot />
  </div>
</div>
