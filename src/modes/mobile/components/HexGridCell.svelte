<script>
  export let style = '';
  export let className = '';
  export let classNameOuter = '';

  export let x = -1;
  export let y = -1;

  export let border = 0;

  $: isDefined = x >= 0 && y >= 0;
</script>

<style>
  .hexgrid_cell {
    /* get right aspect ratio */
    padding-top: 57.735%; /* 1 / sqrt(3) */
    position: relative;
    margin: 14.434% 0;

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

  .hexgrid_cell_content {
    position: absolute;
    left: 0;
    top: -50%;
    bottom: -50%;
    right: 0;
    /* hexagon shape */
    clip-path: polygon(0% 25%, 50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%);
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .hexgrid_cell__border {
    --border-size: 1px;
    border: var(--border-size) solid currentColor;
    border-top-width: 0 !important;
    border-bottom-width: 0 !important;
  }

  .hexgrid_cell__border::before,
  .hexgrid_cell__border::after {
    z-index: -1;
    content: '';
    left: calc(-1 * var(--border-size));
    top: 0;
    right: calc(-1 * var(--border-size));
    bottom: 0;
    position: absolute;
    border: inherit;
    box-sizing: inherit;
    border-radius: inherit;
  }

  .hexgrid_cell__border::before {
    transform: rotate(-60deg);
  }
  .hexgrid_cell__border::after {
    transform: rotate(60deg);
  }
</style>

<div
  class="hexgrid_cell {classNameOuter}"
  style={isDefined ? `grid-column-start: ${1 + x * 2 + (y % 2)}; grid-row-start: ${y + 1}` : ''}>
  <div
    class="hexgrid_cell_content {className}"
    class:hexgrid_cell__border={border !== 0}
    style="--border-size: {border}; {style}"
    on:click>
    <slot />
  </div>
</div>
