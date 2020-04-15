<script>
  import { onMount } from "svelte";
  import Options from "./Options.svelte";
  import Time from "./Time.svelte";
  import MapBox from "./MapBox.svelte";
  import Graph from "./Graph.svelte";

  import { data, sensors } from "./stores.js";

  const ENDPOINT = "https://delphi.cmu.edu/epidata/api.php?source=covidcast";

  // Fetch data for each sensor and granularity
  // This is terrible code I apologize - it writes a query for each sensor/map level pair, and writes it to the data store.
  onMount(_ => {
    let queries = [];
    let entries = [];
    $sensors.forEach(s => {
      // TODO: update to do different times.
      s.levels.forEach(l => {
        let query =
          ENDPOINT +
          "&name=" +
          s.id +
          "&geo_type=" +
          l +
          "&dates=20100101-20300101" +
          "&geo_id=*";
        queries.push(fetch(query).then(d => d.json()));
        entries.push([s.id, l]);
      });
    });
    Promise.all(queries).then(d => {
      let dat = {};
      entries.forEach((ent, i) => {
        dat[ent[0]] ? "" : (dat[ent[0]] = {});
        dat[ent[0]][ent[1]] = d[i].epidata;
      });
      data.set(dat);
    });
  });
</script>

<div class="brands pure-g">
  <a href="cmu.edu">
    <img
      src="./cmu.png"
      width="300px"
      alt="carnegie mellon university letter heading" />
  </a>
  <div class="pure-menu pure-menu-horizontal pure-u-1 pure-u-md-1-3">
    <ul class="pure-menu-list pure-u-1 pure-u-md-2-3">
      <li class="pure-menu-item">
        <a href="https://delphi.midas.cs.cmu.edu/" class="pure-menu-link">
          Delphi Research
        </a>
      </li>
      <li class="pure-menu-item">
        <a href="#" class="pure-menu-link">Partners</a>
      </li>
      <li class="pure-menu-item">
        <a href="#" class="pure-menu-link">Privacy</a>
      </li>
    </ul>
  </div>
</div>

<div class="header">
  <h1 class="title">COVID-19 Delphi Dashboard</h1>
  <h2 class="subtitle">
    Data sources used by the Carnegie Mellon Delphi team for monitoring and
    forecasting COVID-19 cases
  </h2>
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
