<script>
  import { onMount } from 'svelte';
  import Options from './Options.svelte';
  import Tabs from './Tabs.svelte';
  import Time from './Time.svelte';
  import MapBox from './MapBox.svelte';
  import Graph from './Graph.svelte';

  import { data, sensors, times, signalType, currentRange } from './stores.js';

  import * as d3 from 'd3';

  const ENDPOINT = 'https://delphi.cmu.edu/epidata/api.php?source=covidcast&time_type=day';
  const ENDPOINT_META = 'https://delphi.cmu.edu/epidata/api.php?source=covidcast_meta';

  // this is for graph dev purposes
  let use_real_data = true;

  if (use_real_data === false) {
    console.log('using fake network requests');
    onMount(_ => {
      d3.json('./temp_graph_data/meta_request_results.json').then(meta => {
        console.log(meta);
        let queries = [];
        let entries = [];
        let timeMap = new Map();
        $sensors.forEach(sens => {
          let date = meta.epidata.find(d => d.data_source === sens.id);
          let minDate = date.min_time;
          let maxDate = date.max_time;
          timeMap.set(sens.id, [minDate, maxDate]);
          sens.levels.forEach(l => {
            entries.push([sens.id, l]);
          });
        });

        // faking queries with d3.json()
        queries.push(d3.json('./temp_graph_data/fb_survey_cli_county_20200406-20200413.json'));
        queries.push(d3.json('./temp_graph_data/fb_survey_cli_msa_20200406-20200413.json'));
        queries.push(d3.json('./temp_graph_data/google-survey_cli_county_20200411-20200416.json'));
        queries.push(d3.json('./temp_graph_data/quidel_negativeratio_county_20200201-20200409.json'));
        queries.push(d3.json('./temp_graph_data/quidel_negativeratio_msa_20200201-20200409.json'));
        queries.push(d3.json('./temp_graph_data/ght_smoothedsearch_msa_20200201-20200412.json'));

        let dat = {};
        Promise.all(queries).then(d => {
          console.log(d);
          entries.forEach((ent, i) => {
            dat[ent[0]] ? '' : (dat[ent[0]] = {});
            dat[ent[0]][ent[1]] = d[i].epidata;
          });
          times.set(timeMap);
          data.set(dat);
        });
      });
    });
  }

  if (use_real_data === true) {
    console.log('using real network requests');
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
            let date = meta.epidata.find(d => d.data_source === sens.id);
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
          let dat = {};
          Promise.all(queries).then(d => {
            console.log(d);
            entries.forEach((ent, i) => {
              dat[ent[0]] ? '' : (dat[ent[0]] = {});
              dat[ent[0]][ent[1]] = d[i].epidata;
            });
            times.set(timeMap);
            data.set(dat);
          });
        });
    });
  }
</script>

<style>
  .options-container {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1000;
    width: 250px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    padding: 10px 10px;
    box-sizing: border-box;

    transition: all 0.1s ease-in;

    /* background-color: black; */
    /* border: 1px solid black; */
  }

  .tabs-container {
    position: absolute;
    top: 10px;
    left: 50px;
    right: 50px;
    z-index: 1000;
    /* max-width: 750px; */
    /* background-color: rgba(255, 255, 255, 0.7); */
    border-radius: 8px;
    padding: 10px 10px;
    box-sizing: border-box;

    display: flex;
    justify-content: center;
    align-items: center;

    transition: all 0.1s ease-in;

    /* background-color: black; */
    /* border: 1px solid black; */
  }

  .legend-container {
    position: absolute;
    bottom: calc(2vh + 410px);
    right: 2vh;
    z-index: 1001;
    width: 400px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 1rem;
    padding: 10px 15px;
    box-sizing: border-box;
    display: inline-flex;
    justify-content: space-between;

    transition: all 0.1s ease-in;
  }

  .graph-container {
    position: absolute;
    bottom: 2vh;
    right: 2vh;
    z-index: 1001;
    max-width: 400px;
    height: 400px;
    width: 400px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 1rem;
    padding: 10px 15px;
    box-sizing: border-box;

    transition: all 0.1s ease-in;
  }

  .time-container {
    position: absolute;
    bottom: 40px;
    left: 20px;
    z-index: 1002;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
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

  .color {
    width: 20px;
    height: 20px;
    margin-right: 10px;
    display: inline-block;
    border: 1px solid #dbdbdb;
  }

  .legend-container p {
    align-items: center;
    justify-content: center;
    display: flex;
  }

  .legend-bar {
    background: linear-gradient(to right, #fff, #c41230);
    width: 300px;
    height: 20px;
  }

  .dec {
    background-color: #224477;
  }
  .const {
    background-color: #fff;
  }
  .inc {
    background-color: #c41230;
  }
</style>

<MapBox />

<div class="options-container">
  <Options />
</div>

<div class="tabs-container">
  <Tabs />
</div>

<div class="time-container">
  <Time />
</div>

<div class="legend-container">
  {#if $signalType === 'direction'}
    <p>
      <span class="color dec" />
      Decreasing
    </p>
    <p>
      <span class="color const" />
      Constant
    </p>
    <p>
      <span class="color inc" />
      Increasing
    </p>
  {:else}
    <p>None</p>
    <p class="legend-bar" />
    <p>High</p>
  {/if}
</div>

<div class="graph-container">
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
