<script>
  import { onMount, setContext } from "svelte";
  import { levels, selectedRegion, geojsons, currentLevel } from "./stores.js";
  import mapboxgl from "mapbox-gl";
  import * as d3 from "d3";

  // https://docs.mapbox.com/help/glossary/access-token/
  mapboxgl.accessToken =
    "pk.eyJ1IjoiYW5kcmV3a3V6bmV0c292IiwiYSI6ImNrOHYwYmEwdzA3bWgzbnE1aGR5d2p1OXcifQ.sSs1i6cqPbX1UOSLsDHD6A";

  const LAT = 37;
  const LON = -95;
  const ZOOM = 3.5;

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
    map = new mapboxgl.Map({
      attributionControl: false,
      container,
      style: "./map_styles/mapbox_albers_usa_style.json",
      center: [LON, LAT],
      zoom: ZOOM,
      // maxBounds: new mapboxgl.LngLatBounds([-171.791110603, 18.91619], [-66.96466, 71.3577635769]),  // geo coords bounds of US (including Alaska, Hawaii)
    })
      .addControl(
        new mapboxgl.AttributionControl({
          compact: true,
        }),
      )
      .addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    console.log(map);

    // Time filtering snippet once we get data
    // map.setFilter('collisions', ['==', ['number', ['get', 'Hour']], hour]);
    // We can also update the data: map.getSource('trace').setData(data);

    map.on("load", function() {
      $levels.forEach(name => {
        let data = $geojsons.get(name);
        data.features.forEach(d => (d.properties.val = Math.random()));
        map.addSource(name, {
          type: "geojson",
          data: data,
        });
        map.addLayer({
          id: name,
          source: name,
          type: "fill",
          layout: { visibility: "none" },
          paint: {
            "fill-color": {
              property: "val",
              stops: [[0, "#fff"], [1, "#f00"]],
            },
            "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0.5],
          },
        });
        map.on("click", name, function(e) {
          selectedRegion.set(e.features[0].properties.NAME);
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(e.features[0].properties.NAME)
            .addTo(map);
        });
      });
      // Set all layers to not visible and currentLevel visible.
      updateMap();
    });
  }
</script>

<style>
  div {
    width: 100%;
    height: 600px;
  }
</style>

<div bind:this={container} />
