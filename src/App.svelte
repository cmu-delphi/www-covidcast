<script>
  import Options from "./Options.svelte";
  import Time from "./Time.svelte";
  // import Map from "./Map.svelte";
  import MapBox from "./MapBox.svelte";
  import Graph from "./Graph.svelte";

  // fetch(
  //   "https://delphi.midas.cs.cmu.edu/epidata/api.php?source=fluview&regions=nat&epiweeks=201501"
  // )
  //   .then(d => d.text())
  //   .then(d => console.log(d));
</script>

<div class="header">
  <div>
    <h1 class="title">COVID-19 Delphi Dashboard</h1>
    <h2 class="subtitle">
      Data sources used by the Carnegie Mellon Delphi team for monitoring and forecasting
      COVID-19 cases
    </h2>
  </div>
  <div>
    <img
      src="./cmu.png"
      width="400px"
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
      <!-- <Map /> -->
      <MapBox lat={35} lon={-84} zoom={3.5} />
    </div>
  </div>
  <div class="pure-u-1 pure-u-md-1-3">
    <div class="block">
      <Graph />
    </div>
  </div>
</div>
