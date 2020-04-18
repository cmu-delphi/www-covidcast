<script>
  import mapboxgl from 'mapbox-gl';
  import {
    levels,
    currentRegion,
    geojsons,
    currentLevel,
    currentSensor,
    currentData,
    currentRange,
    data,
    signalType,
  } from './stores.js';

  const LAT = -1.2;
  const LON = -0.5;
  const ZOOM = 4.3; // should be set to 4.4 as default

  let container;
  let map;

  // Boolean tracking if the map has been initialized.
  let mounted = false;

  // If it hasn't been initialized and we have geojsons and initial data, create map.
  $: if (!map && $geojsons.size !== 0 && $currentData.length !== 0) initializeMap();

  // Update the map when sensor or level changes.
  currentLevel.subscribe(_ => updateMap());
  currentSensor.subscribe(_ => updateMap());
  currentData.subscribe(_ => updateMap());
  signalType.subscribe(_ => updateMap());

  function updateMap() {
    if (!mounted) return;

    let minMax = [999999999, -1];
    let mappedVals = new Map();
    let geoIds = new Set(
      $currentData.map(d => {
        let dat = d[$signalType];
        minMax[0] = dat < minMax[0] ? dat : minMax[0];
        minMax[1] = dat > minMax[1] ? dat : minMax[1];
        if (dat) {
          mappedVals.set(d.geo_value, d[$signalType]);
        }
        return d.geo_value;
      }),
    );
    currentRange.set(minMax);

    let dat = $geojsons.get($currentLevel);
    dat.features.forEach(d => {
      let id;
      if ($currentLevel === 'county') {
        id = d.properties.GEO_ID.slice(-5);
      } else if ($currentLevel === 'msa') {
        id = d.properties.CBSAFP;
      }
      d.properties.id = id;
      if (geoIds.has(id) && mappedVals.get(id)) {
        d.properties.val = mappedVals.get(id);
      } else {
        d.properties.val = -100;
      }
    });

    let stops = [[minMax[0], '#fff'], [minMax[1], '#c41230']];
    if ($signalType === 'direction') {
      stops = [[-1, '#224477'], [0, '#fff'], [1, '#c41230']];
    }

    map.getSource($currentLevel).setData(dat);
    map.getStyle().layers.find(d => d.id === $currentLevel) ? map.removeLayer($currentLevel) : '';
    map.addLayer({
      id: $currentLevel,
      source: $currentLevel,
      type: 'fill',
      filter: ['!=', 'val', -100],
      paint: {
        'fill-outline-color': 'black',
        'fill-color': {
          property: 'val',
          stops: stops,
        },
      },
    });

    map.on('click', $currentLevel, function(e) {
      currentRegion.set(e.features[0].properties.id);
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(e.features[0].properties.NAME + '<br />' + e.features[0].properties.val)
        .addTo(map);
    });
  }

  function initializeMap() {
    map = new mapboxgl.Map({
      attributionControl: false,
      container,
      style: './maps/mapbox_albers_usa_style.json',
      center: [LON, LAT],
      zoom: ZOOM,
      minZoom: ZOOM,
    })
      .addControl(new mapboxgl.AttributionControl({ compact: true }))
      .addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    //Disable touch zoom, it makes gesture scrolling difficult
    map.scrollZoom.disable();

    map.on('load', function() {
      map.addSource('county-outline', {
        type: 'geojson',
        data: $geojsons.get('county'),
      });
      map.addSource('state-outline', {
        type: 'geojson',
        data: $geojsons.get('state'),
      });
      map.addLayer({
        id: 'county-outline',
        source: 'county-outline',
        type: 'fill',
        paint: {
          'fill-color': '#f9f9f9',
          'fill-outline-color': '#e0e0e0',
        },
      });
      map.addLayer({
        id: 'state-outline',
        source: 'state-outline',
        type: 'fill',
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0)',
          'fill-outline-color': '#bcbcbc',
        },
      });

      Object.keys($levels).forEach(name => {
        let data = $geojsons.get(name);
        map.addSource(name, {
          type: 'geojson',
          data: data,
        });
      });

      mounted = true;
      updateMap();
    });
  }

  function zoomBack() {}
</script>

<style>
  .map-container {
    width: 100vw;
    height: 100vh;
    position: relative;
  }

  .state-buttons-holder {
    position: absolute;
    top: 81px;
    right: 9px;
    z-index: 100;
  }

  .state-buttons-holder button:focus {
    outline: none;
  }

  .state-buttons-holder .pg-button {
    font-size: 23px;
    position: relative;
    width: 29px;
    height: 29px;
    color: #3a3a3a;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    padding: 0;
    box-sizing: content-box;
    background-color: white;
    border: 1px solid #d5d5d5;
    border-radius: 4px;
    text-align: center;
    font-family: 'FranklinITCProBold', Helvetica, Arial, sans-serif;
    line-height: 16px;
    cursor: pointer;
    text-decoration: none;
    user-select: none;
    transition-delay: 0s;
    transition-duration: 0.15s;
    transition-property: background-color;
    transition-timing-function: ease-in-out;
  }

  .state-buttons-holder .pg-button:hover {
    background-color: rgb(213, 213, 213);
  }

  .state-buttons-holder .pg-button img {
    width: 90%;
    /* height: 100%; */
  }
</style>

<div bind:this={container} class="map-container">
  <div class="state-buttons-holder">
    <button
      data-state="us48"
      id="bounds-button"
      class="pg-button bounds-button"
      on:click={_ => map.easeTo({ center: [LON, LAT], zoom: ZOOM })}>
      <img src="./assets/imgs/us48.png" alt="" />
    </button>
  </div>
</div>
