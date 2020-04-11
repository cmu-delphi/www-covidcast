<script>
  import { onMount } from "svelte";
  import { selected } from "./stores.js";
  import { feature, mesh } from "topojson";
  import * as d3 from "d3";

  let el;
  let w;
  $: drawMap(w);
  onMount(_ => drawMap());
  function drawMap() {
    var margin = {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      },
      width = w - margin.left - margin.right,
      mapRatio = 0.5,
      height = width * mapRatio,
      active = d3.select(null);

    d3.select(el).html("");
    var svg = d3
      .select(el)
      .append("svg")
      .attr("class", "center-container")
      .attr("height", height + margin.top + margin.bottom)
      .attr("width", width + margin.left + margin.right);

    svg
      .append("rect")
      .attr("class", "background center-container")
      .attr("height", height + margin.top + margin.bottom)
      .attr("width", width + margin.left + margin.right)
      .on("click", clicked);

    Promise.resolve(d3.json("./counties-10m.json")).then(ready);

    var projection = d3
      .geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(width);

    var path = d3.geoPath().projection(projection);

    var g = svg
      .append("g")
      .attr("class", "center-container center-items us-state")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    function ready(us) {
      g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data(feature(us, us.objects.counties).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "county-boundary")
        .on("mouseover", d => selected.set(d.properties.name))
        .on("click", reset);

      g.append("g")
        .attr("id", "states")
        .selectAll("path")
        .data(feature(us, us.objects.states).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "state")
        .on("mouseover", d => selected.set(d.properties.name))
        .on("click", clicked);

      g.append("path")
        .datum(
          mesh(us, us.objects.states, function(a, b) {
            return a !== b;
          })
        )
        .attr("id", "state-borders")
        .attr("d", path);
    }

    function clicked(d) {
      if (d3.select(".background").node() === this) return reset();

      if (active.node() === this) return reset();

      active.classed("active", false);
      active = d3.select(this).classed("active", true);

      var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = 0.9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

      g.transition()
        .duration(750)
        .style("stroke-width", 1.5 / scale + "px")
        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
    }

    function reset() {
      active.classed("active", false);
      active = d3.select(null);

      g.transition()
        .delay(100)
        .duration(750)
        .style("stroke-width", "1.5px")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }
  }
</script>

<style>

</style>

<div bind:clientWidth={w}>
  <div id="map" bind:this={el} />
</div>
