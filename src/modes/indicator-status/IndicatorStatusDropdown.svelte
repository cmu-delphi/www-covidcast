<script>
  import caretDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-down.svg';

  /**
   * @type {Promise<import('./data').ExtendedStatus[]>}
   */
  export let data = Promise.resolve([]);
  /**
   * binding two ways
   * @type {Promise<import('./data').ExtendedStatus>}
   */
  export let selected;

  let open = false;

  function switchIndicator(newIndicator) {
    open = false;
    selected = newIndicator;
  }
</script>

<div class="uk-container content-grid parameters">
  <div class="dropdown-container grid-3-11" class:open on:click|stopPropagation={() => undefined}>
    <button type="button" class="trigger" on:click={() => (open = !open)}>
      {selected ? selected.name : 'Loading'}
      <span class="inline-svg-icon down-icon">
        {@html caretDownIcon}
      </span>
    </button>
    <ul class="content">
      {#await data then indicators}
        {#each indicators as indicator}
          <li>
            <a class="uk-text-muted" href="#{indicator.name}" on:click|preventDefault={() => switchIndicator(indicator)}
              >{indicator.name}</a
            >
          </li>
        {/each}
      {/await}
    </ul>
  </div>
</div>
<svelte:window
  on:click={() => {
    if (open) {
      open = false;
    }
  }}
/>

<style>
  .parameters {
    margin-top: 6px;
    margin-bottom: 6px;
  }
  .dropdown-container {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
  }
  .trigger {
    position: relative;
    background: white;
    text-align: left;
    font-weight: 600;
    height: 50px;
    font-size: 0.875rem;
    line-height: 1rem;
    padding: 10px 6px 10px 24px;
    border: 1px solid #d3d4d8;
    color: #666;
    border-radius: 4px;
  }

  .down-icon {
    font-size: 80%;
    fill: #999;
    position: absolute;
    left: 0;
    top: 0;
    width: 35px;
    height: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }

  .down-icon > :global(svg) {
    width: 20px;
    height: 20px;
  }

  .content {
    display: none;
    border: 1px solid #d3d4d8;
    border-radius: 3px;
    list-style: none;
    background: white;
    margin: 6px 0;
    padding-bottom: 0.5em;
  }

  .down-icon {
    left: unset;
    right: 0;
  }
  .open > .content {
    display: block;
  }
</style>
