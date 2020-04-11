<script>
  import { onMount, setContext } from "svelte";
  import mapboxgl from "mapbox-gl";

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
        map.addSource("population", {
          type: "vector",
          url: "mapbox://mapbox.660ui7x6"
        });
        console.log(map);
        map.addLayer(
          {
            id: "state-population",
            source: "population",
            "source-layer": "state_county_population_2014_cen",
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
        map.on("click", "state-population", function(e) {
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(e.features[0].properties.name)
            .addTo(map);
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
