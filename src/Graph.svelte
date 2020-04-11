<script>
  import { onMount } from "svelte";
  import {
    selectedRegion,
    currentSensor,
    currentLevel,
    sampleData
  } from "./stores.js";
  import * as d3 from "d3";

  // to get the value for sampleData, use $sampleData.
  // It is currently in the form of {date: , value: }

  let el;
  let w;
  // the $ syntax just says, if w is changed, run drawGraph() - e.g. redraw the graph when the window is resized.
  $: w, drawGraph();
  // This subscribes to sample data to redraw the graph every time the data changes.
  sampleData.subscribe(_ => drawGraph());
  onMount(_ => drawGraph());

  function drawGraph() {
    let data = $sampleData;
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

    var x = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width]);
    var y = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => +d.value)])
      .range([height, 0]);

    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));

    let line = d3
      .line()
      .x(d => x(d.date))
      .y(d => y(+d.value));

    svg
      .append("path")
      .attr("class", "line")
      .attr("d", line(data));
  }
</script>

<p>cool line graph with options</p>
<p>
  currently viewing sensor
  <b>{$currentSensor}</b>
  at level
  <b>{$currentLevel}</b>
  for
  <b>{$selectedRegion}</b>
</p>
<!-- bind:this sets the variable el to the HTML div you can then select using d3 as above-->
<div bind:clientWidth={w}>
  <div bind:this={el} />
</div>
