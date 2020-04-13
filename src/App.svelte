<script>
  import Options from "./Options.svelte";
  import Time from "./Time.svelte";
  import MapBox from "./MapBox.svelte";
  import Graph from "./Graph.svelte";
</script>

<div class="header pure-g">
  <div class="pure-u-1 pure-u-md-2-3">
    <h1 class="title">COVID-19 Delphi Dashboard</h1>
    <h2 class="subtitle">
      Data sources used by the Carnegie Mellon Delphi team for monitoring and forecasting
      COVID-19 cases
    </h2>
  </div>
  <div class="pure-u-1 pure-u-md-1-3">
    <img
      src="./cmu.png"
      width="100%"
      alt="carnegie mellon university letter heading" />
  </div>
</div>
<div class="pure-g">
  <div class="pure-u-1 pure-u-md-2-3">
    <div class="block">
      <Options />
    </div>
  </div>
  <div class="pure-u-1 pure-u-md-1-3">
    <div class="block">
      <Time />
    </div>
  </div>
</div>
<div class="pure-g">
  <div class="pure-u-1 pure-u-md-2-3">
    <div class="block">
      <MapBox />
    </div>
  </div>
  <div class="pure-u-1 pure-u-md-1-3">
    <div class="block">
      <Graph />
    </div>
  </div>
</div>
