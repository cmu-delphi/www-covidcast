<script>
  import { currentSensor, metaDataManager } from '../../stores';
  import { DEFAULT_SENSOR } from '../../stores/constants';
  import AboutSection from '../../components/AboutSection.svelte';
  import SensorSearch from '../../components/SensorSearch.svelte';

  $: resolvedSignal = $metaDataManager.getSensor($currentSensor) || $metaDataManager.getSensor(DEFAULT_SENSOR);
  function setSensor(d) {
    currentSensor.set(d.key);
  }
</script>

<div class="mobile-root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>Indicator Status of <span>{resolvedSignal ? resolvedSignal.name : 'Signal'}</span></h2>
    </div>
    <div class="uk-container content-grid">
      <SensorSearch
        className="grid-3-11"
        modern
        items={$metaDataManager.metaSensors}
        selectedItem={resolvedSignal}
        on:change={(e) => setSensor(e.detail)}
      />
    </div>
  </div>
  <div class="uk-container content-grid">
    <AboutSection className="uk-margin-small-top uk-margin-small-bottom">
      <h3 class="mobile-h3">About {resolvedSignal ? resolvedSignal.name : 'Signal'}</h3>
      <div class="desc">Name, API Name, Description, Link to API Docs</div>
    </AboutSection>
    <div class="grid-3-11">
      <hr />
    </div>
  </div>
</div>
