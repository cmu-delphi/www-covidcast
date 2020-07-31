<script>
  import MapBox from '../../components/MapBox.svelte';
  import { currentRegion } from '../../stores';
  import '../../stores/urlHandler';
  import '../../stores/ga';
  import { trackEvent } from '../../stores/ga';

  let graphShowStatus = false;
  let firstLoaded = true;

  currentRegion.subscribe((r) => {
    if (firstLoaded && r !== '') {
      toggleGraphShowStatus(null, false);
      firstLoaded = false;
    } else if (r) {
      toggleGraphShowStatus(null, true);
    } else {
      toggleGraphShowStatus(null, false);
    }
  });

  function toggleGraphShowStatus(event, to = null) {
    if (to !== null) {
      graphShowStatus = to;
    } else {
      graphShowStatus = !graphShowStatus;
    }
    trackEvent('graph', graphShowStatus ? 'show' : 'hide');
  }
</script>

<style>

</style>

<MapBox {graphShowStatus} {toggleGraphShowStatus} />
