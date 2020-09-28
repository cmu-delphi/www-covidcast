<script>
  import modes from '../modes';
  import { currentMode } from '../stores';
</script>

<style>
  .mode-container {
    padding-left: 0.5em;
    --frame-color: #dedede;
  }

  .mode-button {
    padding: 0.25em 0.5em;
    min-width: 8em;
    line-height: 1;
    box-sizing: border-box;
    color: #333;
    text-align: center;
    vertical-align: bottom;

    cursor: pointer;
    text-decoration: none;
    user-select: none;

    transition: backround-color 0.15s ease-in-out;

    background-color: #ffffff;
  }

  /** deskop **/
  @media only screen and (min-width: 768px) {
    .mode-container {
      border-bottom: 1px solid var(--frame-color);
    }

    .mode-button {
      margin-bottom: -1px;

      border: 1px solid transparent;
      border-bottom-color: var(--frame-color);
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }

    .active,
    .mode-button:hover,
    .mode-button:focus,
    .mode-button:active {
      border: 1px solid var(--frame-color) !important;
      border-bottom-color: #ffffff !important;
      background-color: #ffffff !important;
    }
  }

  @media only screen and (max-width: 767px) {
    .mode-button {
      display: block;
      width: 100%;
      border: 0;
      text-align: left;
      border-bottom: 1px solid var(--bg) !important;
      margin: 0;
    }
    .hideMobile {
      display: none;
    }

    .active,
    .mode-button:hover,
    .mode-button:focus,
    .mode-button:active {
      background-color: #ececec;
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
