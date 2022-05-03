<script>
  /** eslint-disable a11y-label-has-associated-control */
  import toggleOnIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/toggle-on.svg';

  export let className = '';
  export let checked = undefined;
  export let group = undefined;
  export let before = '';
  export let noPadding = false;
  export let name = undefined;
  export let value = undefined;
</script>

<!-- svelte-ignore a11y-label-has-associated-control -->
<label class="toggle {className}" class:checked class:noPadding>
  {#if before}
    <span>{before}</span>
  {/if}
  {#if group != null}
    <input type="checkbox" bind:group {value} {name} />
  {:else}
    <input type="checkbox" bind:checked {value} {name} />
  {/if}
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
    fill: var(--toggle-color, #1890ff);
    transform: scale(1, 1);
  }

  @media only screen and (min-width: 750px) {
    input + :global(svg) {
      width: 3em;
    }
  }
</style>
