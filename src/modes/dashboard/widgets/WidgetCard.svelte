<script>
  export let highlighted = false;
  /**
   * @type {{width?: number; height?: number; x?: number; y?: number} | null}
   */
  export let grid = null;

  function gridToStyle(grid) {
    if (!grid) {
      return null;
    }
    let style = '';
    if (grid.x != null) {
      style += `grid-column-start: ${grid.x}; `;
    }
    if (grid.y != null) {
      style += `grid-row-start: ${grid.y}; `;
    }
    if (grid.width != null) {
      style += `grid-column-end: span ${grid.width}; `;
    }
    if (grid.height != null) {
      style += `grid-row-end: span ${grid.height}; `;
    }
    return style;
  }
</script>

<div
  class="widget-card uk-card uk-card-small uk-card-default uk-card-body"
  class:highlighted
  style={gridToStyle(grid)}
  on:
>
  <slot />
</div>

<style>
  .widget-card {
    border-radius: 4px;
    display: flex;
  }
  .widget-card > :global(*) {
    flex: 1 1 0;
  }
  .widget-card.highlighted {
    box-shadow: 0 0 15px 0 #888;
  }
</style>
