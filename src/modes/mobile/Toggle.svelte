<script>
  import toggleOffIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/toggle-off.svg';
  import toggleOnIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/toggle-on.svg';

  export let checked = false;
</script>

<style>
  .toggle {
    position: relative;
    cursor: pointer;
  }
  .toggle > input {
    visibility: hidden;
  }
  .toggle > :global(svg) {
    position: absolute;
    left: 0;
    top: 0;
    width: 1.2em;
    height: 100%;
    display: none;
    fill: #c4c4c4;
  }
  .toggle > :global(svg:last-of-type) {
    display: inline-block;
  }
  .toggle.checked > :global(svg:last-of-type) {
    display: none;
  }
  .toggle.checked > :global(svg:first-of-type) {
    display: inline-block;
  }
</style>

<label class="toggle" class:checked>
  <input type="checkbox" bind:checked />
  {@html toggleOnIcon}
  {@html toggleOffIcon}
  <span>
    <slot />
  </span>
</label>
