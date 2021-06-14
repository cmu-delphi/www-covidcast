<script>
  import IndicatorStatusTable from './IndicatorStatusTable.svelte';
  import { loadData, determineDomain } from './data';
  import AboutSection from '../../components/AboutSection.svelte';

  const date = new Date();

  $: data = loadData(date);

  /**
   * @type {import('../../stores/params').TimeFrame}
   */
  let domain = determineDomain([]);
  /**
   * @type {import('./data').ExtendedStatus[]}
   */
  let loadedData = [];

  $: {
    loadedData = [];
    domain = determineDomain([]);
    data.then((rows) => {
      loadedData = rows;
      domain = determineDomain(rows);
    });
  }

  function switchToDetails(e) {
    console.log(e.detail);
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
      <IndicatorStatusTable {data} {date} on:select={switchToDetails} {domain} />
    </div>
  </div>
</div>
