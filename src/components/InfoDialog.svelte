<script>
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';
  import { signalCasesOrDeathOptions, currentInfoSensor } from '../stores';

  let close = null;

  /**
   * @param {KeyboardEvent} e
   */
  function onEscCheck(e) {
    if (!$currentInfoSensor) {
      return;
    }
    if (e.key === 'Escape' || e.key === 'Esc') {
      currentInfoSensor.set(null);
    }
  }

  $: {
    if ($currentInfoSensor && close) {
      close.focus();
    }
  }
</script>

<style>
  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: none;
    padding: 1em 0.5em;
    max-width: 40em;
    z-index: 5000;
  }

  .close {
    position: absolute;
    top: 2px;
    right: 2px;
  }

  .links {
    margin-top: 1em;
    display: flex;
    align-items: center;
    justify-content: center;
    list-style-type: none;
    font-size: 80%;
    line-height: 1.35em;
  }

  .links > li:not(:first-of-type)::before {
    content: '•';
    transform: translate(-0.35em);
  }

  .links > li {
    list-style-type: none;
    padding: 0;
    display: flex;
  }

  .links a {
    color: rgba(0, 0, 0, 0.65);
    font-weight: 700;
    margin: 0.15em 0;
  }
</style>

{#if $currentInfoSensor}
  <div class="dialog container-bg container-style">
    <button
      bind:this={close}
      class="pg-button close"
      on:click={() => {
        currentInfoSensor.set(null);
      }}
      title="Close this popup">
      <IoIosClose />
    </button>
    <h2>
      {typeof $currentInfoSensor.mapTitleText === 'function' ? $currentInfoSensor.mapTitleText($signalCasesOrDeathOptions) : $currentInfoSensor.mapTitleText}
    </h2>
    <div>
      {@html $currentInfoSensor.longDescription ?? 'No description available'}
    </div>
    <ul class="links">
      {#each $currentInfoSensor.links as link}
        <li><a href={link.href}>{link.alt}</a></li>
      {/each}
    </ul>
  </div>
{/if}
<svelte:window on:keydown={onEscCheck} />
