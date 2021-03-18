<script>
  import toggleOnIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/toggle-on.svg';
  
  export let className = '';
  export let checked = false;
  export let before = '';
</script>

<label class="toggle {className}" class:checked>
  {before}
  <input type="checkbox" bind:checked />
  {@html toggleOnIcon}
  <slot />
</label>

<style>
  .toggle {
    cursor: pointer;
    padding: 1em 0;
    display: inline-block;
  }
  input {
    visibility: hidden;
  }
  input + :global(svg) {
    margin-left: -1.4em;
    width: 3em;
    margin-right: 0.4em;
    display: inline-block;
    fill: #c4c4c4;
    transform: scale(-1, 1);
    transition: color 0.25s ease;
  }
  input:checked + :global(svg) {
    fill: #1890ff;
    transform: scale(1, 1);
  }
</style>
