<script>
  import { onMount, setContext } from "svelte";
  import { selected } from "./stores.js";
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

  onMount(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/mapbox-gl/dist/mapbox-gl.css";

    link.onload = () => {
      map = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/streets-v9",
        center: [lon, lat],
        zoom
      });

      map.on("load", function() {
        d3.json("./gz_2010_us_050_00_5m.json").then(d => {
          console.log(d);
          map.addSource("counties", {
            type: "geojson",
            data: d
          });
          map.addLayer({
            id: "counties-level",
            source: "counties",
            type: "fill",
            layout: {},
            paint: {
              "fill-color": "#627BC1",
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                1,
                0.5
              ]
            }
          });
          map.on("click", "counties-level", function(e) {
            selected.set(e.features[0].properties.NAME);
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(e.features[0].properties.NAME)
              .addTo(map);
          });
        });
      });
    };

    document.head.appendChild(link);

    return () => {
      map.remove();
      link.parentNode.removeChild(link);
    };
  });
</script>

<style>
  div {
    width: 100%;
    height: 600px;
  }
</style>

<div bind:this={container} />
