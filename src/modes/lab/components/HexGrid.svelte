<script>
  export let columns = 10;
  export let style = '';
  export let className = '';

  export let rowHint = 0;
  export let shadow = false;
</script>
<style>
  .hexgrid {
    --columns: 10;
    --active-columns: var(--columns);
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(calc(2 * var(--active-columns, 10) + 1), 1fr);
  }

  .shadow {
    filter: drop-shadow(0 0 4px black);
  }

  .hexgrid__auto_filler {
    grid-row-start: calc(var(--row) * 2 + 2);
  }
  .hexgrid__auto_filler_right {
    grid-column-start: calc(var(--active-columns) * 2 + 1);
    grid-row-start: calc(var(--row) * 2 + 1);
  }

  @media only screen and (max-width: 576px) {
    .hexgrid {
      --active-columns: var(--columns-xs, var(--columns-sm, var(--columns)));
    }
  }
  @media only screen and (min-width: 576px) {
    .hexgrid {
      --active-columns: var(--columns-sm, var(--columns-md, var(--columns)));
    }
  }
  @media only screen and (min-width: 768px) {
    .hexgrid {
      --active-columns: var(--columns-md, var(--columns));
    }
  }
  @media only screen and (min-width: 992px) {
    .hexgrid {
      --active-columns: var(--columns-lg, var(--columns-md, var(--columns)));
    }
  }
  @media only screen and (min-width: 1200px) {
    .hexgrid {
      --active-columns: var(--columns-xl, var(--columns-lg, var(--columns-md, var(--columns))));
    }
  }
  @media only screen and (min-width: 1400px) {
    .hexgrid {
      --active-columns: var(--columns-xxl, var(--columns-xl, var(--columns-lg, var(--columns-md, var(--columns)))));
    }
  }
</style>

<div class="hexgrid {className}" class:shadow style="--columns: {columns}; {style}">
  {#each Array(rowHint).fill(0) as _,i}
    <div class="hexgrid__auto_filler" style="--row: {i}" />
    <div class="hexgrid__auto_filler_right" style="--row: {i}" />
  {/each}

  <slot />
</div>
