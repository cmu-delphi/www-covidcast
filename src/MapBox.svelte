<script>
  import { onMount, setContext } from "svelte";
  import {
    levels,
    selectedRegion,
    geojsons,
    currentLevel,
    currentSensor,
    currentData,
    data
  } from "./stores.js";
  import mapboxgl from "mapbox-gl";
  import * as d3 from "d3";

  const LAT = 1.07;
  const LON = 0.25;
  const ZOOM = 3.9;

  let container;
  let map;
  let points = [];
  currentData.subscribe(d => console.log(d));

  // If the map has been initizlied and the currentLevel changed, update the map.
  currentLevel.subscribe(_ => updateMap());
  function updateMap() {
    if (!map) return;
    Object.keys($levels).forEach(l =>
      map.setLayoutProperty(l, "visibility", "none")
    );
    map.setLayoutProperty($currentLevel, "visibility", "visible");

    let currData = $currentData.filter(d => d.date === "2020-04-11");
    let geoIds = currData.map(d => d.geo_id);
    let data = $geojsons.get($currentLevel);
    data.features.forEach(d => {
      if (geoIds.includes(d.properties.GEO_ID.slice(-5))) {
        d.properties.val = 1;
      } else {
        d.properties.val = 0;
      }
    });
    map.getSource($currentLevel).setData(data);
  }

  // If map isn't initialized and geojsons have been loaded, draw layers.
  $: if (!map && $geojsons.size !== 0) initializeMap();

  function initializeMap() {
    map = new mapboxgl.Map({
      attributionControl: false,
      container,
      style: "./maps/mapbox_albers_usa_style.json",
      center: [LON, LAT],
      zoom: ZOOM,
      minZoom: ZOOM,
      maxBounds: new mapboxgl.LngLatBounds([-23.25, -14.54], [21.8, 13.4]) // geo coords bounds of US (including Alaska, Hawaii)
    })
      .addControl(
        new mapboxgl.AttributionControl({
          compact: true
        })
      )
      .addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "top-right"
      );

    // Time filtering snippet once we get data
    // map.setFilter('collisions', ['==', ['number', ['get', 'Hour']], hour]);
    // We can also update the data: map.getSource('trace').setData(data);

    map.on("load", function() {
      Object.keys($levels).forEach(name => {
        let data = $geojsons.get(name);
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
              stops: [[0, "#f9f9f9"], [1, "#c41230"]]
            },
            // "fill-color": "#f9f9f9",
            "fill-outline-color": "#CB2F4A"
            // "fill-opacity": [
            //   "case",
            //   ["boolean", ["feature-state", "hover"], false],
            //   1,
            //   0.5
            // ]
          }
        });
        map.on("click", name, function(e) {
          selectedRegion.set(e.features[0].properties.NAME);
          console.log(e.features[0].properties);
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(e.features[0].properties.NAME)
            .addTo(map);
        });
      });
      map.addLayer(
        {
          id: "county-outline",
          source: "county",
          type: "fill",
          paint: {
            "fill-color": "#f9f9f9",
            "fill-outline-color": "#e0e0e0"
          }
        },
        "county"
      );
      map.addLayer(
        {
          id: "state-outline",
          source: "state",
          type: "fill",
          paint: {
            "fill-color": "#f9f9f9",
            "fill-outline-color": "#e3e3e3"
          }
        },
        "county-outline"
      );

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
