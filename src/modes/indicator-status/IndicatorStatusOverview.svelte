<script>
  import IndicatorStatusTable from './IndicatorStatusTable.svelte';
  import AboutSection from '../../components/AboutSection.svelte';
  import { modeByID } from '..';
  import { currentSensor, switchToMode } from '../../stores';

  function switchToDetails(e) {
    currentSensor.set(`${e.detail.source}-${e.detail.reference_signal}`);
    switchToMode(modeByID['indicator-source']);
  }
</script>

<div class="mobile-root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>Indicator Status <span>Overview</span></h2>
    </div>
  </div>
  <div class="uk-container content-grid">
    <AboutSection className="uk-margin-small-top uk-margin-small-bottom">
      <h3 class="mobile-h3">About</h3>
      <div class="desc">TODO</div>
    </AboutSection>
    <div class="grid-3-11">
      <IndicatorStatusTable on:select={switchToDetails} />
    </div>
  </div>
</div>
