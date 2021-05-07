<script>
  export let name = 'option';
  export let required = undefined;
  /**
   * @type {string | null}
   */
  export let value = null;
  export let label = 'Options';
  /**
   * @type {{label: string, value: string}[]}
   */
  export let options = [];

  export let className = '';
  export let style = undefined;

  export let modern = false;
</script>

<div class="option-picker {className}" {style}>
  <span class="option-picker-label">{label}</span>
  <select {name} class="option-picker-input" class:modern bind:value on:blur {required}>
    <slot>
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </slot>
  </select>
</div>

<style>
  .option-picker {
    color: #666;
    display: inline-block;
    position: relative;
  }

  .option-picker-input {
    display: block;
    padding: 8px 0px 8px 6px;
    border: 1px solid #d3d4d8;
    background: white;
    font-size: 0.875rem;
    line-height: 1rem;
    border-radius: 4px;
    color: inherit;
  }

  .option-picker-input.modern {
    padding: 10px 0 10px 6px;
    font-size: 0.75rem;
    height: 50px;
  }

  .option-picker-input > :global(option) {
    color: inherit;
    font-size: inherit;
  }

  .option-picker-label {
    position: absolute;
    top: -0.3em;
    left: 6px;
    font-size: 0.75rem;
    background: white;
    line-height: 1;
  }
</style>
