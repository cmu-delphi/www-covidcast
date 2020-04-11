<script>
  import { onMount } from "svelte";
  import mapboxgl from "mapbox-gl";

  mapboxgl.accessToken =
    "pk.eyJ1IjoiYW5kcmV3a3V6bmV0c292IiwiYSI6ImNrOHYwYmEwdzA3bWgzbnE1aGR5d2p1OXcifQ.sSs1i6cqPbX1UOSLsDHD6A";
  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v10",
    center: [-98, 38.88],
    minZoom: 3,
    zoom: 3
  });

  var zoomThreshold = 4;

  // For source self host on

  map.on("load", function() {
    map.addSource("population", {
      type: "vector",
      url: "mapbox://mapbox.660ui7x6"
    });

    // Adding data from local example
    // https://ovrdc.github.io/gis-tutorials/mapbox/05-2-choropleth/#3.14/36.98/-77.61

    map.addLayer(
      {
        id: "state-population",
        source: "population",
        "source-layer": "state_county_population_2014_cen",
        maxzoom: zoomThreshold,
        type: "fill",
        filter: ["==", "isState", true],
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "population"],
            0,
            "#F2F12D",
            500000,
            "#EED322",
            750000,
            "#E6B71E",
            1000000,
            "#DA9C20",
            2500000,
            "#CA8323",
            5000000,
            "#B86B25",
            7500000,
            "#A25626",
            10000000,
            "#8B4225",
            25000000,
            "#723122"
          ],
          "fill-opacity": 0.75
        }
      },
      "waterway-label"
    );

    map.addLayer(
      {
        id: "county-population",
        source: "population",
        "source-layer": "state_county_population_2014_cen",
        minzoom: zoomThreshold,
        type: "fill",
        filter: ["==", "isCounty", true],
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "population"],
            0,
            "#F2F12D",
            100,
            "#EED322",
            1000,
            "#E6B71E",
            5000,
            "#DA9C20",
            10000,
            "#CA8323",
            50000,
            "#B86B25",
            100000,
            "#A25626",
            500000,
            "#8B4225",
            1000000,
            "#723122"
          ],
          "fill-opacity": 0.75
        }
      },
      "waterway-label"
    );
  });

  var stateLegendEl = document.getElementById("state-legend");
  var countyLegendEl = document.getElementById("county-legend");
  map.on("zoom", function() {
    if (map.getZoom() > zoomThreshold) {
      stateLegendEl.style.display = "none";
      countyLegendEl.style.display = "block";
    } else {
      stateLegendEl.style.display = "block";
      countyLegendEl.style.display = "none";
    }
  });

  // Made a basic pop-up, should really be sending stuff to viz ayers.
  map.on("click", "state-population", function(e) {
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(e.features[0].properties.name)
      .addTo(map);
  });

  map.on("click", "county-population", function(e) {
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(e.features[0].properties.name)
      .addTo(map);
  });

  //zoom and highlight state.

  // Add slider
  // https://docs.mapbox.com/mapbox-gl-js/example/timeline-animation/

  // Change the cursor to a pointer when the mouse is over the states layer.
  map.on("mouseenter", "state-population", function() {
    map.getCanvas().style.cursor = "pointer";
  });

  // Change it back to a pointer when it leaves.
  map.on("mouseleave", "state-population", function() {
    map.getCanvas().style.cursor = "";
  });

  // Change the cursor to a pointer when the mouse is over the states layer.
  map.on("mouseenter", "county-population", function() {
    map.getCanvas().style.cursor = "pointer";
  });

  // Change it back to a pointer when it leaves.
  map.on("mouseleave", "county-population", function() {
    map.getCanvas().style.cursor = "";
  });
</script>

<div id="map" />
<div id="state-legend" class="legend">
  <h4>State ILI (Mock data)</h4>
  <div>
    <span style="background-color: #723122" />
    25,000,000
  </div>
  <div>
    <span style="background-color: #8B4225" />
    10,000,000
  </div>
  <div>
    <span style="background-color: #A25626" />
    7,500,000
  </div>
  <div>
    <span style="background-color: #B86B25" />
    5,000,000
  </div>
  <div>
    <span style="background-color: #CA8323" />
    2,500,000
  </div>
  <div>
    <span style="background-color: #DA9C20" />
    1,000,000
  </div>
  <div>
    <span style="background-color: #E6B71E" />
    750,000
  </div>
  <div>
    <span style="background-color: #EED322" />
    500,000
  </div>
  <div>
    <span style="background-color: #F2F12D" />
    0
  </div>
</div>

<div id="county-legend" class="legend" style="display: none;">
  <h4>Count ILI (Mock data)</h4>
  <div>
    <span style="background-color: #723122" />
    1,000,000
  </div>
  <div>
    <span style="background-color: #8B4225" />
    500,000
  </div>
  <div>
    <span style="background-color: #A25626" />
    100,000
  </div>
  <div>
    <span style="background-color: #B86B25" />
    50,000
  </div>
  <div>
    <span style="background-color: #CA8323" />
    10,000
  </div>
  <div>
    <span style="background-color: #DA9C20" />
    5,000
  </div>
  <div>
    <span style="background-color: #E6B71E" />
    1,000
  </div>
  <div>
    <span style="background-color: #EED322" />
    100
  </div>
  <div>
    <span style="background-color: #F2F12D" />
    0
  </div>
</div>
