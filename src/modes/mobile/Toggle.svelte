<script>
  import toggleOffIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/toggle-off.svg';
  import toggleOnIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/toggle-on.svg';

  export let checked = false;
</script>

<style>
  .toggle {
    cursor: pointer;
    padding: 1em 0;
    display: inline-block;
  }
  .toggle-wrapper {
    position: relative;
  }
  .toggle-wrapper > input {
    visibility: hidden;
  }
  .toggle-wrapper > :global(svg) {
    position: absolute;
    left: 0;
    top: 0;
    width: 1.2em;
    height: 100%;
    display: none;
    fill: #c4c4c4;
  }
  .toggle-wrapper > :global(svg:last-of-type) {
    display: inline-block;
  }
  .toggle-wrapper.checked > :global(svg:last-of-type) {
    display: none;
  }
  .toggle-wrapper.checked > :global(svg:first-of-type) {
    display: inline-block;
  }
</style>

<!-- svelte-ignore a11y-label-has-associated-control -->
<label class="toggle">
  <slot name="before" />
  <span class="toggle-wrapper" class:checked>
    <input type="checkbox" bind:checked />
    {@html toggleOnIcon}
    {@html toggleOffIcon}
  </span>
  <span>
    <slot />
  </span>
</label>
