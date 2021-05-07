<script>
  export let value;
  export let readonly = false;
</script>

<div>
  <label for="widget-adder-w" class="uk-form-label">Widget</label>
  <select
    id="widget-adder-w"
    class="uk-select"
    name="type"
    label="Widget"
    bind:value
    required
    {readonly}
    disabled={readonly}
  >
    <optgroup label="Charts">
      <option value="line">Time Series Widget</option>
      <option value="map">Choropleth Map Widget</option>
      <option value="hex">Hexagon Map Widget</option>
    </optgroup>
    <optgroup label="Tables">
      <option value="regiontable">Region Table Widget</option>
      <option value="datetable">Date Table Widget</option>
      <option value="sensortable">Indicator Table Widget</option>
    </optgroup>
    <optgroup label="Parallel Coordinates Plots">
      <option value="regionpcp">Region PCP Widget</option>
      <option value="datepcp">Date PCP Widget</option>
    </optgroup>
    <optgroup label="Simple">
      <option value="kpi">Value Widget</option>
      <option value="trend">Trend Widget</option>
    </optgroup>
    <optgroup label="Date Focussed">
      <option value="line">Time Series Widget</option>
      <option value="datetable">Date Table Widget</option>
      <option value="datepcp">Date PCP Widget</option>
    </optgroup>
    <optgroup label="Region Focussed">
      <option value="map">Choropleth Map Widget</option>
      <option value="hex">Hexagon Map Widget</option>
      <option value="regiontable">Region Table Widget</option>
      <option value="regionpcp">Region PCP Widget</option>
    </optgroup>
  </select>
</div>

<style>
  .uk-select optgroup {
    color: #444;
  }
</style>
