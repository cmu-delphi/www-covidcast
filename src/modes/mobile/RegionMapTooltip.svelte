<script>
  import { formatDateShort } from '../../formats';
  import { levelMegaCounty } from '../../stores/constants';

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow & import('../../maps').NameInfo}
   */
  export let item;

  /**
   * @type {import('../../stores/params').SensorEntry}
   */
  export let sensor;

  export let regionSetter = null;

  function changeRegion() {
    console.log('x');
    if (regionSetter) {
      regionSetter(item);
    }
  }
</script>

<style>
  .hidden {
    display: none;
  }

  h5 {
    margin: 0;
    padding: 0;
  }

  th {
    text-align: left;
  }
  td {
    text-align: right;
  }
</style>

<div
  aria-label="tooltip"
  class="tooltip"
  class:hidden
  on:touchstart|stopPropagation={() => undefined}
  on:mousedown|stopPropagation={() => undefined}>
  <h5>
    {#if regionSetter && item.level !== levelMegaCounty.id}
      <a class="uk-link-muted" href="?region={item.propertyId}" on:click|preventDefault={changeRegion}>
        {item.displayName}
      </a>
    {:else}{item.displayName}{/if}
  </h5>
  <table>
    <tr>
      <th>{formatDateShort(item.date_value)}</th>
      <td>{sensor.formatValue(item.value)}</td>
    </tr>
  </table>
</div>
