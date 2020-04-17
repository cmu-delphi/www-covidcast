<script>
  import { onMount } from 'svelte';
  import Options from './Options.svelte';
  import Time from './Time.svelte';
  import MapBox from './MapBox.svelte';
  import Graph from './Graph.svelte';

  import { data, sensors, times } from './stores.js';

  const ENDPOINT = 'https://delphi.cmu.edu/epidata/api.php?source=covidcast&time_type=day';
  const ENDPOINT_META = 'https://delphi.cmu.edu/epidata/api.php?source=covidcast_meta';

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
          let minDate = date.min_time;
          let maxDate = date.max_time;
          timeMap.set(sens.id, [minDate, maxDate]);
          sens.levels.forEach(l => {
            let query =
              ENDPOINT +
              '&data_source=' +
              sens.id +
              '&signal=' +
              sens.signal +
              '&geo_type=' +
              l +
              '&time_values=' +
              minDate +
              '-' +
              maxDate +
              '&geo_value=*';
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
            dat[ent[0]] ? '' : (dat[ent[0]] = {});
            dat[ent[0]][ent[1]] = d[i].epidata;
          });
          times.set(timeMap);
          data.set(dat);
        });
      });
  });
</script>

<style>
  .options-container {
    position: fixed;
    top: 2vh;
    left: 2vh;
    z-index: 1000;
    max-width: 400px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 1rem;
    padding: 10px 15px;
    box-sizing: border-box;

    transition: all 0.1s ease-in;

    /* background-color: black; */
    /* border: 1px solid black; */
  }

  .graph-container {
    position: fixed;
    bottom: 2vh;
    right: 2vh;
    z-index: 1001;
    max-width: 400px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 1rem;
    padding: 10px 15px;
    box-sizing: border-box;

    transition: all 0.1s ease-in;
  }

  .time-container {
    position: fixed;
    bottom: 4vh;
    left: calc(2vh + 400px);
    z-index: 1002;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 1rem;
    padding: 5px 10px;
    box-sizing: border-box;
    width: 500px;

    transition: all 0.1s ease-in;
  }

  .options-container:hover,
  .time-container:hover,
  .graph-container:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
</style>

<MapBox />

<div class="options-container">
  <Options />
</div>

<div class="time-container ">
  <Time />
</div>

<div class="graph-container ">
  <Graph />
</div>

<!-- 
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
</div> -->
