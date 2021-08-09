<script>
  import { formatWeek } from '../../../formats';

  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;

  export let value = '';

  let useDefault = value === '';
</script>

<div>
  <label for="widget-adder-d" class="uk-form-label">Week</label>
  <label>
    <input class="uk-checkbox" type="checkbox" bind:checked={useDefault} /> Use Configured Week
  </label>
  {#if useDefault}
    <input id="widget-adder-d" class="uk-input" value={formatWeek(date.week)} disabled readonly />
  {:else}
    <input
      id="widget-adder-d"
      class="uk-input"
      value={value || formatWeek(date.week)}
      pattern="\d\d\d\dW?\d\d"
      name="date"
    />
  {/if}
</div>
