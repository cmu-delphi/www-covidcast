<script>
  import { onMount } from "svelte";
  import { selected, currentSensor, currentLevel } from "./stores.js";
  import * as d3 from "d3";

  let el;
  let w;
  $: w, drawGraph();
  onMount(_ => drawGraph());
  function drawGraph() {
    var margin = { top: 10, right: 30, bottom: 30, left: 60 },
      width = w - margin.left - margin.right,
      height = w - margin.top - margin.bottom;

    d3.select(el).html("");
    var svg = d3
      .select(el)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("./timeseries.csv").then(data => {
      var parseTime = d3.timeParse("%Y-%m-%d");

      data.forEach(d => (d.date = parseTime(d.date)));
      data.sort((a, b) => a.date - b.date);
      var x = d3
        .scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);
      var y = d3
        .scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([height, 0]);

      svg
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
      svg.append("g").call(d3.axisLeft(y));

      let line = d3
        .line()
        .x(d => x(d.date))
        .y(d => y(d.value));

      svg
        .append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", line);
      // // Show confidence interval
      // svg
      //   .append("path")
      //   .datum(data)
      //   .attr("fill", "#cce5df")
      //   .attr("stroke", "none")
      //   .attr(
      //     "d",
      //     d3
      //       .area()
      //       .x(function(d) {
      //         return x(d.x);
      //       })
      //       .y0(function(d) {
      //         return y(d.CI_right);
      //       })
      //       .y1(function(d) {
      //         return y(d.CI_left);
      //       })
      //   );

      // Add the line
      // svg
      //   .append("path")
      //   .datum(data)
      //   .attr("fill", "none")
      //   .attr("stroke", "steelblue")
      //   .attr("stroke-width", 1.5)
      //   .attr("d");
    });
  }
</script>

<p>cool line graph with options</p>
<p>
  currently viewing sensor
  <b>{$currentSensor}</b>
  at level
  <b>{$currentLevel}</b>
  for
  <b>{$selected}</b>
</p>
<div bind:clientWidth={w}>
  <div id="map" bind:this={el} />
</div>
