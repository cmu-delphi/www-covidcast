<script>
  import modes from '../modes';
  import { currentMode } from '../stores';
</script>

<style>
  .mode-container {
    padding-left: 0.5em;
    --frame-color: #dedede;
    border-bottom: 1px solid var(--frame-color);
  }

  .mode-button {
    width: 12%;
    padding: 0.25em 0;
    min-width: 4.2em;
    margin-bottom: -1px;
    line-height: 1;
    box-sizing: border-box;
    color: #333;
    text-align: center;
    vertical-align: bottom;

    cursor: pointer;
    text-decoration: none;
    user-select: none;

    transition-delay: 0s;
    transition-duration: 0.15s;
    transition-property: background-color;
    transition-timing-function: ease-in-out;

    border: 1px solid transparent;
    border-bottom-color: var(--frame-color);
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;

    background-color: #ffffff;
  }

  .active,
  .mode-button:hover,
  .mode-button:focus,
  .mode-button:active {
    border: 1px solid var(--frame-color) !important;
    border-bottom-color: #ffffff !important;
    background-color: #ffffff !important;
  }

  @media only screen and (max-width: 767px) {
    .hideMobile {
      display: none;
    }
    .mode-button {
      display: block;
      width: 100%;
      border: 0;
      text-align: left;
      border-bottom: 1px solid var(--bg);
    }
  }
</style>

<nav class="mode-container">
  {#each modes as mode}
    <button
      class="mode-button"
      class:active={$currentMode.id === mode.id}
      on:click={() => {
        currentMode.set(mode);
      }}
      title={mode.tooltip}
      class:hideMobile={mode.id === 'export'}>
      {mode.label}
    </button>
  {/each}
</nav>
