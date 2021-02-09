<script>
  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @type {import('../../data').EpiDataRow}
   */
  export let item;

  export let prop = '';

  export let currentDateItem = null;

  $: increasing = false;

  $: formattedProp = '';

  $: {
    if (currentDateItem) {
      const later = item.date_value > currentDateItem.date_value;
      const firstValue = later ? currentDateItem[prop] : item[prop];
      const secondValue = later ? item[prop] : currentDateItem[prop];
      increasing = secondValue - firstValue > 0;
      const formattedChange = sensor.formatValue(secondValue - firstValue);
      formattedProp = !currentDateItem ? '' : `${increasing ? '+' : ''}${formattedChange}`;
    }
  }
</script>

<style>
  .increasing {
    color: red;
  }
  .decreasing {
    color: green;
  }
</style>

{#if currentDateItem}
  <span class="root"> (<span class:increasing class:decreasing={!increasing}> {formattedProp}</span>) </span>
{/if}
