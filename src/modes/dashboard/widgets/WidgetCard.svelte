<script>
  export let highlighted = false;
  export let width = 1;
  export let height = 1;
</script>

<div
  class="widget-card uk-card uk-card-small uk-card-default uk-card-body"
  class:highlighted
  style="grid-column-end: span {width}; grid-row-end: span {height}"
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
    box-shadow: 0 5px 15px steelblue;
  }
</style>
