<script>
  import Options from "./Options.svelte";
  import Time from "./Time.svelte";
  import Map from "./Map.svelte";
  import Graph from "./Graph.svelte";
  import { data } from "./stores.js";
</script>

<h1>Delphi COVID-19 Forecasting and Surveillance</h1>
<div class="pure-g">
  <div class="pure-u-2-3">
    <div class="block">
      <Options />
    </div>
  </div>
  <div class="pure-u-1-3">
    <div class="block">
      <Time />
    </div>
  </div>
</div>
<div class="pure-g">
  <div class="pure-u-2-3">
    <div class="block">
      <Map />
    </div>
  </div>
  <div class="pure-u-1-3">
    <div class="block">
      <Graph />
    </div>
  </div>
</div>
