<script>
  import { onMount } from "svelte";
  import Options from "./Options.svelte";
  import Time from "./Time.svelte";
  import MapBox from "./MapBox.svelte";
  import Graph from "./Graph.svelte";

  import { data, sensors, times } from "./stores.js";

  const ENDPOINT = "https://delphi.cmu.edu/epidata/api.php?source=covidcast";
  const ENDPOINT_META =
    "https://delphi.cmu.edu/epidata/api.php?source=covidcast_meta";

  // Fetch data for each sensor and granularity
  onMount(_ => {
    fetch(ENDPOINT_META)
      .then(d => d.json())
      .then(meta => {
        console.log(meta);
        let queries = [];
        let entries = [];
        let timeMap = new Map();
        $sensors.forEach(sens => {
          let date = meta.epidata.find(d => d.source === sens.id);
          let minDate = date.min_date.split("-").join("");
          let maxDate = date.max_date.split("-").join("");
          timeMap.set(sens.id, [minDate, maxDate]);
          sens.levels.forEach(l => {
            let query =
              ENDPOINT +
              "&data_source=" +
              sens.id +
              "&signal=" +
              sens.signal +
              "&geo_type=" +
              l +
              "&dates=" +
              minDate +
              "-" +
              maxDate +
              "&geo_id=*";
            queries.push(fetch(query).then(d => d.json()));
            entries.push([sens.id, l]);
          });
        });
        queries.push();
        let dat = {};
        Promise.all(queries).then(d => {
          console.log(d);
          let metadata = d[d.length - 1];
          entries.forEach((ent, i) => {
            dat[ent[0]] ? "" : (dat[ent[0]] = {});
            dat[ent[0]][ent[1]] = d[i].epidata;
          });
          times.set(timeMap);
          data.set(dat);
        });
      });
  });
</script>

<!-- <div class="brands pure-g">
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
</div> -->

<!-- <div class="header">
  <h1 class="title">COVID-19 Delphi Dashboard</h1>
  <h2 class="subtitle">
    Data sources used by the Carnegie Mellon Delphi team for monitoring and
    forecasting COVID-19 cases
  </h2>
</!-->

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
