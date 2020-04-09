<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  let el;
  onMount(_ => {
    // Write all d3 here.
    let svg = d3
      .select(el)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "500px");
    var projection = d3.geoEqualEarth().rotate([90, 0, 0]);
    var path = d3.geoPath().projection(projection);

    var url = "http://enjalot.github.io/wwsd/data/world/world-110m.geojson";

    d3.json(url).then(usa => {
      svg
        .append("path")
        .attr("d", path(usa))
        .attr("fill", "lightgray")
        .attr("stroke", "white");
    });
  });
</script>

<p>main map interface</p>
<div id="map" bind:this={el} />
