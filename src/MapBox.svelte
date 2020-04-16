<script>
  import mapboxgl from "mapbox-gl";
  import {
    levels,
    selectedRegion,
    geojsons,
    currentLevel,
    currentSensor,
    currentData,
    data
  } from "./stores.js";

  const LAT = 1.07;
  const LON = 0.25;
  const ZOOM = 3.9;

  let container;
  let map;

  // Boolean tracking if the map has been initialized.
  let mounted = false;

  // If it hasn't been initialized and we have geojsons and initial data, create map.
  $: if (!map && $geojsons.size !== 0 && $currentData.length !== 0)
    initializeMap();

  // Update the map when sensor or level changes.
  currentLevel.subscribe(_ => updateMap());
  currentSensor.subscribe(_ => updateMap());
  currentData.subscribe(_ => updateMap());

  function updateMap() {
    if (!mounted) return;
    Object.keys($levels).forEach(l =>
      map.setLayoutProperty(l, "visibility", "none")
    );
    map.setLayoutProperty($currentLevel, "visibility", "visible");

    // TODO: Can currently only draw for county.
    if ($currentLevel === "county") {
      let mappedVals = new Map();
      let geoIds = new Set(
        $currentData.map(d => {
          mappedVals.set(d.geo_id.slice(-5), d.scaled);
          return d.geo_id.slice(-5);
        })
      );

      let dat = $geojsons.get($currentLevel);
      dat.features.forEach(d => {
        let id = d.properties.GEO_ID.slice(-5);
        if (geoIds.has(id)) {
          d.properties.val = mappedVals.get(id);
        } else {
          d.properties.val = -100;
        }
      });

      map.getSource($currentLevel).setData(dat);
    }
  }

  function initializeMap() {
    map = new mapboxgl.Map({
      attributionControl: false,
      container,
      style: "./maps/mapbox_albers_usa_style.json",
      center: [LON, LAT],
      zoom: ZOOM,
      minZoom: ZOOM,
      maxBounds: new mapboxgl.LngLatBounds([-23.25, -14.54], [21.8, 13.4])
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

    map.on("load", function() {
      map.addSource("county-outline", {
        type: "geojson",
        data: $geojsons.get("county")
      });
      map.addSource("state-outline", {
        type: "geojson",
        data: $geojsons.get("state")
      });
      map.addLayer({
        id: "state-outline",
        source: "state-outline",
        type: "fill",
        paint: {
          "fill-color": "#f9f9f9",
          "fill-outline-color": "#e3e3e3"
        }
      });
      map.addLayer({
        id: "county-outline",
        source: "county-outline",
        type: "fill",
        paint: {
          "fill-color": "#f9f9f9",
          "fill-outline-color": "#e0e0e0"
        }
      });
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
          filter: ["!=", "val", -100],
          paint: {
            "fill-color": {
              property: "val",
              stops: [[-3, "#224477"], [3, "#c41230"]]
            },
            "fill-outline-color": "#CB2F4A"
          }
        });
        map.on("click", name, function(e) {
          selectedRegion.set(e.features[0].properties.NAME);
          console.log(e.features[0].properties);
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(
              e.features[0].properties.NAME +
                "<br />" +
                e.features[0].properties.val
            )
            .addTo(map);
        });
      });
      // Set all layers to not visible and currentLevel visible.
      mounted = true;
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
