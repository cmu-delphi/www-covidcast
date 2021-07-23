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
      <div class="desc">
        These pages give information about our data processing system and the statistical behavior of our indicators. If
        you're looking for information about public health and behavior, try one of our other pages. If you're looking
        for how <strong>up-to-date</strong> our public health and behavior data is,
        <strong>how much of the country</strong>
        is covered by our public health and behavior data, and the <strong>data versioning effects</strong> present in our
        public health and behavior data, you're in the right place.
      </div>
    </AboutSection>
    <div class="grid-3-11">
      <IndicatorStatusTable on:select={switchToDetails} />
    </div>
  </div>
</div>
