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

  /**
   * @type {'select' | 'text' | 'number' | 'date'}
   */
  export let type = 'select';

  export let className = '';
  export let style = undefined;

  export let modern = false;

  export let step = undefined;
  export let min = undefined;
  export let max = undefined;
  export let placeholder = undefined;
</script>

<div class="option-picker {className}" {style}>
  <span class="option-picker-label">{label}</span>
  {#if type === 'select'}
    <select {name} class="option-picker-input" class:modern bind:value on:blur {required}>
      <slot>
        {#each options as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </slot>
    </select>
  {:else if type === 'text'}
    <input {name} class="option-picker-input" class:modern bind:value on:change {required} {placeholder} />
  {:else if type === 'number'}
    <input
      type="number"
      {name}
      class="option-picker-input"
      class:modern
      bind:value
      on:change
      {required}
      {step}
      {min}
      {max}
      {placeholder}
    />
  {:else if type === 'date'}
    <input
      type="date"
      {name}
      class="option-picker-input"
      class:modern
      bind:value
      on:change
      {required}
      {step}
      {min}
      {max}
      {placeholder}
    />
  {/if}
</div>

<style>
  .option-picker {
    color: #666;
    display: inline-block;
    position: relative;
  }

  .option-picker-input {
    display: block;
    width: 100%;
    padding: 8px 0px 8px 6px;
    border: 1px solid #d3d4d8;
    background: white;
    font-size: 0.875rem;
    line-height: 1rem;
    border-radius: 4px;
    color: inherit;
    box-sizing: border-box;
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
