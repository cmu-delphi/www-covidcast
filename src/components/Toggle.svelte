<script>
  import toggleOnIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/toggle-on.svg';

  export let className = '';
  export let checked = false;
  export let before = '';
  export let noPadding = false;
</script>

<label class="toggle {className}" class:checked class:noPadding>
  {before}
  <input type="checkbox" bind:checked />
  {@html toggleOnIcon}
  <slot />
</label>

<style>
  .toggle {
    cursor: pointer;
    padding: 1em 0;
    margin-right: 1.5em;
    display: inline-block;
  }
  .toggle.noPadding {
    padding: 0;
  }
  input {
    visibility: hidden;
  }
  input + :global(svg) {
    margin-left: -1.4em;
    width: 2.5em;
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

  @media only screen and (min-width: 750px) {
    input + :global(svg) {
      width: 3em;
    }
  }
</style>
