<script>
  import { formatDateISO } from '../../../formats';

  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;

  export let value = '';

  let useDefault = value === '';
</script>

<div>
  <label for="widget-adder-d" class="uk-form-label">Date</label>
  <label>
    <input class="uk-checkbox" type="checkbox" bind:checked={useDefault} /> Use Configured Date
  </label>
  {#if useDefault}
    <input id="widget-adder-d" class="uk-input" type="date" value={formatDateISO(date.value)} disabled readonly />
  {:else}
    <input
      id="widget-adder-d"
      class="uk-input"
      type="date"
      value={value || formatDateISO(date.value)}
      name="date"
      step="1"
    />
  {/if}
</div>
