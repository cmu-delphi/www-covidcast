<script>
  import Vega from '../../../components/vega/Vega.svelte';
  import { addMissing, fetchTimeSlice } from '../../../data';
  import { generateLineChartSpec } from '../../../specs/lineSpec';
  import HexGridCell from './HexGridCell.svelte';

  /**
   * @type {import("../../../stores/constants").SensorEntry}
   */
  export let sensor;
  /**
   * @type {import('../mobile/utils').Params}
   */
  export let params;

  export let x = -1;
  export let y = -1;

  /**
   * @param {import('../../maps').NameInfo} region
   * @param {Date} date
   */
  function genSpec(region, date, height) {
    const options = {
      initialDate: date,
      height,
    };
    // nation
    const spec = generateLineChartSpec(options);
    spec.padding = { left: 35, top: 18, bottom: 20, right: 5 };
    return spec;
  }

  /**
   * @param {import('../../stores/constants').SensorEntry} sensor
   * @param {import("../utils").Params} params
   */
  function loadData(sensor, params) {
    const region = params.region;
    return fetchTimeSlice(sensor, region.level, region.propertyId, new Date(2020, 10 - 1, 1), params.date, true, {
      displayName: region.displayName,
    }).then((r) => addMissing(r, sensor));
  }

  $: spec = genSpec(params.region, params.date, 150);
  $: data = loadData(sensor, params);

  function findRow(data, date) {
    return data.then((rows) => {
      const v = rows.find((r) => r.date_value.getTime() == date.getTime());
      return v ? v.value : null;
    });
  }

  $: value = findRow(data, params.date);
</script>

<HexGridCell {x} {y} border="2px">
  <div class="root">
    <header on:click>
      <h4>{sensor.name}</h4>
    </header>
    <main>
      <Vega {spec} {data} />
    </main>
    <footer>
      <h5>
        {#await value then v}{sensor.formatValue(v)}{/await}
      </h5>
    </footer>
  </div>
</HexGridCell>

<style>
  .root {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  header,
  footer {
    font-size: 0.5rem;
    flex: 1 1 0;
    padding: 0 15%;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  main {
    flex: 2 2 0;
    position: relative;
    border-width: 1px 0;
    border-style: solid;
    border-color: inherit;
  }
  main > :global(.vega-embed) {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
  h4 {
    margin: 0;
    font-size: 0.875rem;
  }
  header {
    cursor: pointer;
  }
  footer {
    justify-content: flex-start;
  }
  h5 {
    margin: 0;
    margin-top: 0.5em;
    font-size: 1.5rem;
  }
</style>
