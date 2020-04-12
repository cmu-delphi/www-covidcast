<script>
  import { onMount, setContext } from "svelte";
  import { levels, selectedRegion, geojsons, currentLevel } from "./stores.js";
  import mapboxgl from "mapbox-gl";
  import * as d3 from "d3";

  // https://docs.mapbox.com/help/glossary/access-token/
  mapboxgl.accessToken =
    "pk.eyJ1IjoiYW5kcmV3a3V6bmV0c292IiwiYSI6ImNrOHYwYmEwdzA3bWgzbnE1aGR5d2p1OXcifQ.sSs1i6cqPbX1UOSLsDHD6A";

  export let lat;
  export let lon;
  export let zoom;

  let container;
  let map;

  // If the map has been initizlied and the currentLevel changed, update the map.
  currentLevel.subscribe(_ => updateMap());
  function updateMap() {
    if (!map) return;
    $levels.forEach(l => map.setLayoutProperty(l, "visibility", "none"));
    map.setLayoutProperty($currentLevel, "visibility", "visible");
  }

  // If map isn't initialized and geojsons have been loaded, draw layers.
  $: if (!map && $geojsons.size !== 0) initializeMap();

  function initializeMap() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./css/mapbox-gl.css";

    link.onload = () => {
      map = new mapboxgl.Map({
        container,
        style: "./map_styles/basic_v9.json",
        center: [lon, lat],
        zoom
      });

      // Time filtering snippet once we get data
      // map.setFilter('collisions', ['==', ['number', ['get', 'Hour']], hour]);

      map.on("load", function() {
        $levels.forEach(name => {
          let data = $geojsons.get(name);
          data.features.forEach(d => (d.properties.val = Math.random()));
          map.addSource(name, {
            type: "geojson",
            data: data
          });
          map.addLayer({
            id: name,
            source: name,
            type: "fill",
            layout: { visibility: "none" },
            paint: {
              "fill-color": {
                property: "val",
                stops: [[0, "#fff"], [1, "#f00"]]
              },
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                1,
                0.5
              ]
            }
          });
          map.on("click", name, function(e) {
            selectedRegion.set(e.features[0].properties.NAME);
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(e.features[0].properties.NAME)
              .addTo(map);
          });

          // Set all layers to not visible and currentLevel visible.
          updateMap();
        });
      });
    };

    document.head.appendChild(link);

    return () => {
      map.remove();
      link.parentNode.removeChild(link);
    };
  }
</script>

<style>
  div {
    width: 100%;
    height: 600px;
  }
</style>

<div bind:this={container} />
