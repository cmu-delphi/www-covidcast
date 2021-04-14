<script>
  export let flex = false;
  export let highlight = false;
  export let width = 1;
  export let height = 1;
</script>

<div
  class="widget-card uk-card uk-card-small uk-card-default uk-card-body"
  class:flex
  class:highlight
  style="grid-column-end: span {width}; grid-row-end: span {height}"
>
  <slot />
</div>

<style>
  .widget-card {
    border-radius: 4px;
  }
  .widget-card.flex {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .widget-card.highlight {
    box-shadow: 0 5px 15px steelblue;
  }
</style>
