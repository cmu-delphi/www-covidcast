<script>
  import { currentMode } from '../stores';
  import { modeByID } from '../modes';

  export let mode = modeByID.overview;
  export let label = mode.label;
</script>

<style>
  .mode-button {
    width: 12%;
    padding: 0.25em 0;
    min-width: 4.2em;
    margin-right: 0.2em;
    line-height: 1;
    margin: unset;
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

    /* rounded design refresh */
    border: 1px solid #dedede;
    border-bottom: 0;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;

    background-color: #ffffff;
  }

  @media only screen and (max-width: 767px) {
    .mode-button {
      display: block;
      width: 100%;
      border: 0;
      text-align: left;
      border-bottom: 1px solid var(--bg);
    }
  }
</style>

<button
  class="mode-button"
  on:click={() => {
    currentMode.set(mode);
  }}
  title={mode.tooltip}>
  {label}
</button>
