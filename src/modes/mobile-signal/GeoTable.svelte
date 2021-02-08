<script>
  import { getCountiesOfState, getInfoByName, stateInfo } from '../../maps';

  /**
   * @type {import("../utils").Params}
   */
  export let params;

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @param {import('../../maps').NameInfo} region
   */
  function determineRegions(region) {
    if (region.level === 'state') {
      return getCountiesOfState(region);
    }
    if (region.level === 'county') {
      const state = getInfoByName(region.state);
      return getCountiesOfState(state);
    }
    return stateInfo;
  }
  
  /**
   * @param {import('../../maps').NameInfo} region
   * @param {import('../../stores/constants').SensorEntry} sensor
   * @param {Date} date
   */
  function loadData(region, sensor, date) {
     
  }  
  $: regions = determineRegions(params.region);
  $: data = loadData(regions, sensor, params.date);
</script>

<style>
  table {
    border-collapse: collapse;
  }
  thead > tr {
    border-bottom: 1px solid #f0f1f3;
  }
  thead > tr > th {
    padding: 0.75rem 4px;
  }
  tbody {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  tbody > tr > td {
    padding: 0.75rem 4px;
    vertical-align: top;
  }

  tbody > tr:not(:last-of-type) {
    border-bottom: 1px solid #f0f1f3;
  }
</style>

<h2 class="mobile-h2">{sensor.name}</h2>

<table>
  <thead>
    <tr>
      <th class="mobile-th"><span>Region</span></th>
      <th class="mobile-th uk-text-right"><span>Change Last 7 days</span></th>
      <th class="mobile-th uk-text-right"><span>per 100k</span></th>
      <th class="mobile-th uk-text-right"><span>historical trend</span></th>
    </tr>
  </thead>
  <tbody>
    {#each regions as region}
      <tr>
        <td>{region.displayName}</td>
        <td class="uk-text-right">TODO</td>
        <td class="uk-text-right">TODO</td>
        <td>TODO</td>
      </tr>
    {/each}
  </tbody>
</table>
