<script>
  import { currentSensor, metaDataManager } from '../../stores';
  import { DEFAULT_SENSOR } from '../../stores/constants';

  $: resolvedSource =
    $metaDataManager.getSensorSource($currentSensor) || $metaDataManager.getSensorSource(DEFAULT_SENSOR);
</script>

<div class="mobile-root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>Indicator Source <span>{resolvedSource.name}</span></h2>
    </div>
  </div>
  <div class="uk-container content-grid">
    <div class="grid-3-11" />
  </div>
</div>
